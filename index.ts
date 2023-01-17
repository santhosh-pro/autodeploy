import { deploDapr } from "./infra/dapr";
import { createCluster } from "./cluster";
import { deployMongoDBCluster } from "./db/mongo";
import { deployKeycloak } from "./sso";
import { deployAgro } from "./argo";




const provider= createCluster();
 deploDapr("dapr",provider);
 deployMongoDBCluster("mongo",provider);
 deployKeycloak(provider);
// deployAgro("ed",provider);