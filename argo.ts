import * as kubernetes from "@pulumi/kubernetes";

export const deployAgro = ( name: string,
    provider: kubernetes.Provider)=>{
const ns = new kubernetes.core.v1.Namespace("cd", {
    metadata: {
        name: "cd"
    },
},    {provider:provider}
)



new kubernetes.helm.v3.Release(
    name,
    {
      chart: "argo-cd",
      namespace: ns.metadata.name,
      repositoryOpts: {
        repo: "https://argoproj.github.io/argo-helm",
      }
    },
    { parent: ns, provider }
  );
  };