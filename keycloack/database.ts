import * as postgresql from '@pulumi/postgresql';

type KeycloakDatabaseArgs = {
  provider: postgresql.Provider;
};

export const keycloakDatabase = (args: KeycloakDatabaseArgs) => {
  const { provider } = args;
  return new postgresql.Database(
    `keycloak-db`,
    {
      allowConnections: true,
      name: `keycloak`,
      owner: 'postgres',
    },
    {
      provider: provider,
    }
  );
};
