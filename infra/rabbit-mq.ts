import * as kubernetes from "@pulumi/kubernetes";

export const deploRabbitMQ = ( name: string,
    provider: kubernetes.Provider)=>{
const ns = new kubernetes.core.v1.Namespace("message-queue", {
    metadata: {
        name: "message-queue"
    },
},    {provider:provider}
)



new kubernetes.helm.v3.Release(
    name,
    {
      chart: "rabbitmq",
      namespace: ns.metadata.name,
      repositoryOpts: {
        repo: "https://charts.bitnami.com/bitnami",
      }
    },
    { parent: ns, provider }
  );
  };