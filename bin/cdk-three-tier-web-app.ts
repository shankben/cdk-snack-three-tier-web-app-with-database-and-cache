#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkThreeTierWebAppStack } from "../lib/cdk-three-tier-web-app-stack";

const app = new cdk.App();
new CdkThreeTierWebAppStack(app, "CdkThreeTierWebAppStack");
