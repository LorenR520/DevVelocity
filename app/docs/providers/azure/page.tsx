// app/docs/providers/azure/page.tsx

import DocsContent from "../../../../components/DocsContent";

export const metadata = {
  title: "Azure Provider – DevVelocity Docs",
  description:
    "Deploy hardened, enterprise-grade Azure VM images using DevVelocity cloud environments.",
};

export default function AzureProviderPage() {
  return (
    <DocsContent>
      <h1>Microsoft Azure Provider</h1>

      <p>
        DevVelocity publishes enterprise-grade, production-optimized Azure VM
        Images that integrate seamlessly with Azure Compute, Azure Networking,
        and Azure Monitor.
      </p>

      <h2>Supported Azure Regions</h2>
      <p>Images replicate globally with optimized latency routing.</p>

      <ul>
        <li>East US</li>
        <li>East US 2</li>
        <li>West US 2</li>
        <li>Central US</li>
        <li>North Europe</li>
        <li>West Europe</li>
        <li>Southeast Asia</li>
      </ul>

      <h2>Image Architecture</h2>
      <p>Azure images follow DevVelocity’s hardened baseline:</p>
      <ul>
        <li>Azure-optimized kernel & hypervisor agents</li>
        <li>Accelerated Networking enabled</li>
        <li>Cloud-init provisioning support</li>
        <li>Systemd-based init for reliability</li>
        <li>Security baseline following Microsoft CAF (Cloud Adoption Framework)</li>
      </ul>

      <h2>Deployment Methods</h2>

      <h3>1. Azure Portal</h3>
      <ol>
        <li>Go to Azure Portal → Virtual Machines</li>
        <li>Select “Create VM”</li>
        <li>Choose “DevVelocity Image” from Shared Image Library</li>
      </ol>

      <h3>2. Azure CLI</h3>
      <pre>
        <code>
{`az vm create \
  --resource-group myRG \
  --name devvelocity-vm \
  --image <ImageVersionID> \
  --size Standard_D2s_v5 \
  --admin-username azureuser`}
        </code>
      </pre>

      <h3>3. Terraform</h3>
      <pre>
        <code>
{`resource "azurerm_linux_virtual_machine" "devvelocity" {
  name                = "devvelocity-vm"
  resource_group_name = "myRG"
  location            = "East US"
  size                = "Standard_D2s_v5"
  admin_username      = "azureuser"

  source_image_id = "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Compute/galleries/<gallery>/images/<image>/versions/<version>"
}`}
        </code>
      </pre>

      <h2>Network Recommendations</h2>
      <ul>
        <li>Run VMs in isolated subnets with NSG rules</li>
        <li>Use Managed Identities instead of secrets</li>
        <li>Enable Azure Monitor and Log Analytics</li>
        <li>Pair with Azure Bastion for secure login</li>
      </ul>

      <h2>Monitoring & Logging</h2>
      <p>Azure images ship with:</p>
      <ul>
        <li>Azure Linux Agent</li>
        <li>Azure Monitor extensions</li>
        <li>Boot diagnostics enabled</li>
        <li>Syslog + journald integration</li>
      </ul>

      <h2>Best Practices</h2>
      <ul>
        <li>Attach Premium SSD v2 disks for performance</li>
        <li>Keep images updated monthly via DevVelocity Pipelines</li>
        <li>Enforce Azure Policy for compliance</li>
        <li>Use Update Management for patch automation</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Visit your <strong>/dashboard</strong> to deploy Azure images through
        your subscription plan.
      </p>
    </DocsContent>
  );
}
