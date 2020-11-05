#!/usr/bin/env node
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import TheStack from "../lib/stacks/TheStack";

const app = new App();
new TheStack(app, "TheStack");
