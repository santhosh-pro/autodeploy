import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";
import * as kubernetes from "@pulumi/kubernetes";
import { deployMongoDBCluster } from "./mongo";


const cluster = new digitalocean.KubernetesCluster("do-cluster", {
    region: digitalocean.Region.NYC3,
    version: digitalocean.getKubernetesVersions().then(p => p.latestVersion),
    nodePool: {
        name: "default",
        size: digitalocean.DropletSlug.DropletS2VCPU2GB,
        nodeCount: 2,
    },
});


const kubeconfig = cluster.status.apply(status => {
    if (status === "running") {
        const clusterDataSource = cluster.name.apply(name => digitalocean.getKubernetesCluster({name}));
        return clusterDataSource.kubeConfigs[0].rawConfig;
    } else {
        return cluster.kubeConfigs[0].rawConfig;
    }
});


const provider = new kubernetes.Provider("do-k8s", { kubeconfig });


const ingressNamespace = new kubernetes.core.v1.Namespace("nginx-ingress", undefined, { provider: provider });
const ingress = new kubernetes.helm.v3.Release("nginx", {
    chart: "ingress-nginx",
    repositoryOpts: {
        repo: "https://kubernetes.github.io/ingress-nginx",
    },
    namespace: ingressNamespace.metadata.name,
    skipAwait:true
},{provider});

const svc = kubernetes.core.v1.Service.get(
    "nginx-nginx-ingress",
    pulumi.interpolate`${ingress.status.namespace}/${ingress.status.name}-ingress-nginx-controller`,
    {
      provider: provider,
    },
  );
  export const ingressServiceIP = svc.status.apply(status => pulumi.interpolate`${status.loadBalancer.ingress[0].ip}`);

  


  //Domain
  const domain = new digitalocean.Domain("do-domain", {
    name: 'pulumi.santhosh.pro',
    ipAddress: ingressServiceIP,
});

new digitalocean.DnsRecord("do-domain-cname", {
    domain: domain.name,
    type: "CNAME",
    name: "api",
    value: "@",
});

new digitalocean.DnsRecord("do-domain-cname-ui", {
    domain: domain.name,
    type: "CNAME",
    name: "ui",
    value: "@",
});


deployMongoDBCluster('mongo',provider);

//deploy
new kubernetes.yaml.ConfigFile("deploy", {
    file: "k8s.yaml",
  },{provider});