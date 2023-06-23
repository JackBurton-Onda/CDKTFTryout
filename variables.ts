import * as cdktf from "cdktf";
import { Construct } from "constructs";

export class Tfvars extends Construct {
    public defaultRegion: string;
    constructor(
        scope: Construct,
        name: string,
    ) {
        super(scope, name);

        this.defaultRegion = new cdktf.TerraformVariable(this, "default_region", {
            type: cdktf.VariableType.STRING,
            default: "us-east-1",
            description: "Default AWS region to apply to"
        }).value;
    }
}