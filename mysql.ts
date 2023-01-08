import * as kubernetes from "@pulumi/kubernetes";

export const deployMySqlDBCluster = ( name: string,
    provider: kubernetes.Provider)=>{
const ns = new kubernetes.core.v1.Namespace("mysql", {
    metadata: {
        name: "mysql"
    },
},    {provider:provider}
)


const password = "correct-horse-battery-stable-1"
/*
 * We define the secret explicitly
 * then we use replaceOnChanges to ensure it changes and regens a new name
 */
const mysqlPassword = new kubernetes.core.v1.Secret("auth", {
    metadata: {
        namespace: ns.metadata.name
    },
    stringData: {
        "mysql-root-password": password,
        "mysql-replication-password": password,
        "mysql-password": password
    }
}, { replaceOnChanges: [ "stringData" ], parent: ns,provider:provider } )

const mysql = new kubernetes.helm.v3.Release(
    name,
    {
      chart: "mysql",
      namespace: ns.metadata.name,
      repositoryOpts: {
        repo: "https://charts.bitnami.com/bitnami",
      },
      values: {
          auth: {
            existingSecret: mysqlPassword.metadata.name
          }
      }
    },
    { parent: ns, provider }
  );
  };