import * as k8s from '@pulumi/kubernetes';
import * as postgresql from '@pulumi/postgresql';
import { keycloakValues } from './values';
import { keycloakDatabase } from './database';


export const keycloakModule = (provider:any) => {

  const namespace = new k8s.core.v1.Namespace(`keycloak-namespace`, {
    metadata: {
      name: `keycloak`,
    },
    
  },
  {
    provider:provider
  });

  //const database = keycloakDatabase({ provider: provider });
   new k8s.helm.v3.Release(
    `keycloak`,
    {
      chart: 'keycloak',
      namespace: namespace.metadata.name,
      // version: '15.1.3',
      repositoryOpts: {
        repo: 'https://charts.bitnami.com/bitnami',
      },
     values: keycloakValues,
    },
    {
     // dependsOn: [database],
      provider:provider
    }
  );
};
