import * as kubernetes from "@pulumi/kubernetes";
import * as digitalocean from "@pulumi/digitalocean";

export const createCluster = () => {
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
            const clusterDataSource = cluster.name.apply(name => digitalocean.getKubernetesCluster({ name }));
            return clusterDataSource.kubeConfigs[0].rawConfig;
        } else {
            return cluster.kubeConfigs[0].rawConfig;
        }
    });


    const provider = new kubernetes.Provider("do-kubernetes", { kubeconfig });


    //
    const ingressNamespace = new kubernetes.core.v1.Namespace("nginx-ingress", undefined, { provider: provider });
    const ingress = new kubernetes.helm.v3.Release("nginx", {
        chart: "ingress-nginx",
        repositoryOpts: {
            repo: "https://kubernetes.github.io/ingress-nginx",
        },
        namespace: ingressNamespace.metadata.name,
        skipAwait: true
    }, { provider, dependsOn:[cluster] });
    return provider;
}