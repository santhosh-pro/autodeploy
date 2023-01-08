export const keycloakValues = {
  // postgresql: {
  //   enabled: true,
  // },
  extraEnv: `[
    {
      name: "PROXY_ADDRESS_FORWARDING",
      value: "true"
    },
    {
      name: "KEYCLOAK_EXTRA_ARGS",
      value: {
        Dkeycloak.profile.feature.upload_scripts:enabled
      }
    },
    {
      name:"KC_HTTP_ENABLED",
      value:"true"
    },
    {
      name:"KC_HOSTNAME_STRICT_HTTPS",
      value:"false"
    },
    {
      name: "DB_VENDOR",
      value: "postgres"
    },
    {
      name: "DB_PORT",
      value: "5432"
    },
    {
      name: "KEYCLOAK_USER",
      value: "admin"
    },
    {
      name: "KEYCLOAK_PASSWORD",
      value: "admin"
    },
  ]`,
};
