import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { App, CloudBackend, NamedCloudWorkspace, TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { GoogleProjectOAuth2Secret } from "./secretsmanager/secretsmanager";
import { Tfvars } from "./variables";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vars = new Tfvars(this, "main");

    new AwsProvider(this, "AWS", {
      region: vars.defaultRegion,
    });

    const experimental = GoogleProjectOAuth2Secret.getInstance(this, "GoogleCloudOAuth2Token", vars.googleCloudOAuth2CredentialSecretString);
    const otherOutput = GoogleProjectOAuth2Secret.getInstance(this, "otherthing", "Wow a string");

    new TerraformOutput(this, "OtherIDOut", {
      value: experimental.id,
    });

    new TerraformOutput(this, "WORK", {
      value: otherOutput.id
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
