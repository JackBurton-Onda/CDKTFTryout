import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { App, CloudBackend, NamedCloudWorkspace, TerraformStack, TerraformVariable, VariableType } from "cdktf";
import { Construct } from "constructs";
import { Tfvars } from "./variables";
import { OndaSecretsmanager } from "./secretsmanager/secretsmanager";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vars = new Tfvars(this, "main");

    new AwsProvider(this, "AWS", {
      region: vars.defaultRegion,
    });

    const secretsMap = new TerraformVariable(this, "secrets", {
      type: VariableType.map(VariableType.ANY),
    });

    new OndaSecretsmanager(this, "gsm", {
      secrets: secretsMap.value,
    });
  }
}

const app = new App();
const stack = new MyStack(app, "OCI-21");
new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "example-org-49dc1e",
  workspaces: new NamedCloudWorkspace("OCI-21")
});
app.synth();
