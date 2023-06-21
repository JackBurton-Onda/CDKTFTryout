import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace, TerraformVariable, VariableType, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { GenericSecretsManager } from "./oAuthTokenManager";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsRegion = new TerraformVariable(this, "awsRegion", {
      type: VariableType.STRING,
      default: "us-east-1",
      description: "Region to intialize aws resources in."
    });

    const awsAccessKey = new TerraformVariable(this, "awsAccessKey", {
      type: VariableType.STRING,
      description: "Access key for AWS IAM User with SecretsManager R/W Policy.",
      sensitive: true
    });

    const awsSecretAccessKey = new TerraformVariable(this, "awsSecretAccessKey", {
      type: VariableType.STRING,
      description: "Secret Access Key for AWS IAM User with SecretsManager R/W Policy.",
      sensitive: true
    });

    new AwsProvider(this, "AWS", {
      region: awsRegion.value,
      accessKey: awsAccessKey.value,
      secretKey: awsSecretAccessKey.value
    });

    const secretsMap = new TerraformVariable(this, "secrets", {
      type: VariableType.map(VariableType.object({
        description: VariableType.STRING,
        recovery_window_in_days: VariableType.NUMBER,
        secret_string: VariableType.STRING,
        policy: VariableType.STRING
      }))
    })

    new GenericSecretsManager(this, "gsm", {
      Secrets: secretsMap.value,
    })

    new TerraformOutput(this, "mapencode", {
      value: secretsMap.value,
    })
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
