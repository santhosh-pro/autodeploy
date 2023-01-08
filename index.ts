import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";
import * as kubernetes from "@pulumi/kubernetes";
import { deployMongoDBCluster } from "./mongo";
import { deployMySqlDBCluster } from "./mysql";
import { keycloakModule } from "./keycloack";




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


const provider = new kubernetes.Provider("do-kubernetes", { kubeconfig });


const ingressNamespace = new kubernetes.core.v1.Namespace("nginx-ingress", undefined, { provider: provider });
const ingress = new kubernetes.helm.v3.Release("nginx", {
    chart: "ingress-nginx",
    repositoryOpts: {
        repo: "https://kubernetes.github.io/ingress-nginx",
    },
    namespace: ingressNamespace.metadata.name,
    skipAwait: false
},{provider});




keycloakModule(provider);
new kubernetes.yaml.ConfigFile("deploy", {
    file: "k-ingress.yaml",
  },{provider});


  var certManagerNamespace = new kubernetes.core.v1.Namespace("cert-manager", {
    kind: "Namespace",
    metadata: {
        name: "cert-manager",
        labels: {
            app: "cert-manager",
            kind: "namespace"
        }
    },
    apiVersion: "v1"
},
{provider});


var certManager = new kubernetes.helm.v3.Release("cert-manager", {
    chart: "cert-manager",
    repositoryOpts: {
        repo: "https://charts.jetstack.io"
    },
    values: {
        installCRDs: true
    },
    namespace: certManagerNamespace.metadata.name
}, {
    dependsOn: [certManagerNamespace],
    provider:provider
},
)

var clusterIssuer = new kubernetes.apiextensions.CustomResource("letsencrypt", {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: {
        name: "letsencrypt",
    },
    spec: {
        acme: {

            server: "https://acme-v02.api.letsencrypt.org/directory",
            // skipTLSVerify: true,
            // server: "https://pebble:14000/dir",
            email: "santhoshprogrammer94@gmail.com",
            privateKeySecretRef: {
                name: "issuer-account-key",
            },
            solvers: [
                {
                    http01: {
                        ingress: {
                            class: "nginx",
                        }
                    }
                }
            ]
        }
    }
}, {
    dependsOn: [certManager, ingress],
    provider
});












// const svc = kubernetes.core.v1.Service.get(
//     "nginx-nginx-ingress",
//     pulumi.interpolate`${ingress.status.namespace}/${ingress.status.name}-ingress-nginx-controller`,
//     {
//       provider: provider,
//     },
//   );
//   export const ingressServiceIP = svc.status.apply(status => pulumi.interpolate`${status.loadBalancer.ingress[0].ip}`);

  


//   //Domain
//   const domain = new digitalocean.Domain("do-domain", {
//     name: 'pulumi.santhosh.pro',
//     ipAddress: ingressServiceIP,
// });

// new digitalocean.DnsRecord("do-domain-cname", {
//     domain: domain.name,
//     type: "CNAME",
//     name: "api",
//     value: "@",
// });

// new digitalocean.DnsRecord("do-domain-cname-ui", {
//     domain: domain.name,
//     type: "CNAME",
//     name: "ui",
//     value: "@",
// });


// deployMongoDBCluster('mongo',provider);
// deployMySqlDBCluster("mysql",provider)

// //deploy
// new kubernetes.yaml.ConfigFile("deploy", {
//     file: "kubernetes.yaml",
//   },{provider});