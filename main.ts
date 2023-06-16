import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace, TerraformVariable, VariableType, TerraformIterator, Fn } from "cdktf";
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
      type: VariableType.object({
        secrets: VariableType.map(VariableType.object({
          description: VariableType.STRING,
          secret_key_value: VariableType.STRING,
          kms_key_id: VariableType.STRING,
          name_prefix: ,
          policy: VariableType.STRING,
          recovery_window_in_days: VariableType.NUMBER,
          replica: VariableType.list(VariableType.object({
            kms_key_id: VariableType.STRING,
            region: VariableType.STRING
          })),
          force_overwrite_replica_secret: VariableType.BOOL,
          tags: VariableType.MAP_STRING
        }))
      })
    });

    const recovery_window_in_days = new TerraformVariable(this, "recovery_window_in_days", {
      type: VariableType.NUMBER,
      description: "Specifies the number of days that AWS Secrets Manager waits before it can delete the secret. This value can be 0 to force deletion withough recover or range from 7 to 30 days",
      default: 30
    });

    const unmanaged = new TerraformVariable(this, "unmanaged", {
      type: VariableType.BOOL,
      description: "Terraform must ignore secrets lifecycle. Using this option you can initialize the secrets and rotate them outside Terraform, thus avoiding other users to change or rotate the secrets by subsequent runs of Terraform",
      default: false
    });

    const tags = new TerraformVariable(this, "tags", {
      type: VariableType.MAP_STRING,
      description: "Specifies a key-value map of user-defined tags that are attached to the secrets.",
      default: {}
    });

    const secretsIterator = TerraformIterator.fromList(secrets.value.secrets);

    const aws_secretsmanager_secret = new SecretsmanagerSecret(this, "sm", {
      forEach: secretsIterator,
      name: secretsIterator.getString("name_prefix") == null ? secretsIterator.key : null,
      namePrefix: secretsIterator.getString("name_prefix") != null ? secretsIterator.getString("name_prefix") : undefined,
      description: secretsIterator.getString("description") != null ? secretsIterator.getString("description") : undefined,
      kmsKeyId: secretsIterator.getString("kms_key_id") != null ? secretsIterator.getString("kms_key_id") : undefined,
      policy: secretsIterator.getString("policy") != null ? secretsIterator.getString("policy") : undefined,
      forceOverwriteReplicaSecret: secretsIterator.getBoolean("force_overwrite_replica_secret"),
      recoveryWindowInDays: secretsIterator.getNumber("recovery_window_in_days") != null ? secretsIterator.getNumber("recover_window_in_days") : recovery_window_in_days.value,
      tags: Fn.merge([secretsIterator.getStringMap("tags"), tags.value]),
      replica: secretsIterator.dynamic(secretsIterator.getMap("replica")),
    })

    const aws_secretsmanager_version = new SecretsmanagerSecretVersion(this, "sm-sv", {
      forEach: secretsIterator,
      secretId: secretsIterator.key,
      secretString: 
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
