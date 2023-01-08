import * as kubernetes from "@pulumi/kubernetes";

export const deploDapr = (name: string,
    provider: kubernetes.Provider) => {
    const daprSystemNamespaceName = 'dapr-system'
    const daprSystemNamespace = new kubernetes.core.v1.Namespace(daprSystemNamespaceName, {
        metadata: { name: daprSystemNamespaceName }
    }, {  provider })

    // Install Dapr via Helm
    new kubernetes.helm.v3.Release(name, {
        name: name,
        namespace: daprSystemNamespace.metadata.name,
        chart: 'dapr',
        repositoryOpts: {
            repo: 'https://dapr.github.io/helm-charts/',
        },
        version: '1.9',
        values: {
            global: {
                ha: {
                    enabled: true,
                },
            },
        },
        cleanupOnFail: true,
    }, {  provider })

    const appDeployment =new kubernetes.apps.v1.Deployment("zipkin", {
        spec: {
            selector: { matchLabels: { app: "zipkin" }},
            replicas: 1,
            template: {
                metadata: { labels:{ app: "zipkin" }},
                spec: { containers: [{ name: "zipkin", image: "openzipkin/zipkin" }] },
            },
        },
    },{provider});

     new kubernetes.core.v1.Service("zipkin", {
        metadata: { labels: appDeployment.metadata.apply(m => m.labels) },
        spec: {
            type: "ClusterIP",
            ports: [{ port: 9411}],
            selector: appDeployment.spec.apply(spec => spec.template.metadata.labels),
        },
    }, { provider });

    new kubernetes.yaml.ConfigFile("tracing", {
    file: "tracing.yaml",
  },{provider});

new kubernetes.yaml.ConfigFile("pubsub", {
    file: "pubsub.yaml",
  },{provider});

}