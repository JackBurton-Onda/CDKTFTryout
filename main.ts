import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace, TerraformVariable, VariableType, TerraformIterator, Fn, TerraformOutput, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";

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

    const secrets = new TerraformVariable(this, "secrets", {
      type: VariableType.ANY,
      description: "Map of secrets to keep in AWS Secrets Manager",
      default: {}
    });

    const recovery_window_in_days = new TerraformVariable(this, "recovery_window_in_days", {
      type: VariableType.NUMBER,
      description: "Specifies the number of days that AWS Secrets Manager waits before it can delete the secret. This value can be 0 to force deletion withough recover or range from 7 to 30 days",
      default: 30
    });

    // const unmanaged = new TerraformVariable(this, "unmanaged", {
    //   type: VariableType.BOOL,
    //   description: "Terraform must ignore secrets lifecycle. Using this option you can initialize the secrets and rotate them outside Terraform, thus avoiding other users to change or rotate the secrets by subsequent runs of Terraform",
    //   default: false
    // });

    const tags = new TerraformVariable(this, "tags", {
      type: VariableType.ANY,
      description: "Specifies a key-value map of user-defined tags that are attached to the secrets.",
      default: {}
    });

    const secretsIterator = TerraformIterator.fromMap(secrets.value);

    const aws_secretsmanager_secret = new SecretsmanagerSecret(this, "sm", {
      forEach: secretsIterator,
      name: Fn.lookup(secretsIterator.value, "name_prefix", undefined) == undefined ? secretsIterator.key : undefined,
      namePrefix: Fn.lookup(secretsIterator.value, "name_prefix", undefined) != undefined ? secretsIterator.getString("name_prefix") : undefined,
      description: Fn.lookup(secretsIterator.value, "description", undefined),
      kmsKeyId: Fn.lookup(secretsIterator.value, "kms_key_id", undefined),
      policy: Fn.lookup(secretsIterator.value, "policy", undefined),
      forceOverwriteReplicaSecret: Fn.lookup(secretsIterator.value, "force_overwrite_replica_secret", false),
      recoveryWindowInDays: Fn.lookup(secretsIterator.value, "recover_window_in_days", recovery_window_in_days.value),
      tags: Fn.merge([tags.value, Fn.lookup(secretsIterator.value, "tags", undefined)])
    });

    aws_secretsmanager_secret.addOverride("dynamic.replica", {
      for_each: Fn.lookup(secretsIterator.value, "replica_regions", {}),
      content: {
        region: "${replica.key}",
        kms_key_id: "${replica.value}"
      }
    });

    new SecretsmanagerSecretVersion(this, "sm-sv", {
      forEach: secretsIterator,
      secretId: secretsIterator.key,
      secretString: Fn.lookup(secretsIterator.value, "secret_string", undefined) != undefined ? Fn.lookup(secretsIterator.value, "secret_string", undefined) : (Fn.lookup(secretsIterator.value, "secret_key_value", undefined) != undefined ? Fn.jsonencode(Fn.lookup(secretsIterator.value, "secret_key_value", {})) : undefined),
      secretBinary: Fn.lookup(secretsIterator.value, "secret_binary", undefined) != undefined ? Fn.base64encode(secretsIterator.getString("secret_binary")) : undefined,
      dependsOn: [aws_secretsmanager_secret],
      lifecycle: {
        ignoreChanges: ["secret_id"]
      }
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
