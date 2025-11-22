export default function AWS() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">AWS Images</h1>

      <p className="opacity-80 mb-4">
        DevVelocity provides optimized AMIs compatible with EC2, ECS, EKS, and hybrid
        workloads.
      </p>

      <ul className="list-disc ml-6 space-y-2 mb-6">
        <li>Amazon Machine Images (AMI)</li>
        <li>Kernel-optimized builds</li>
        <li>Enhanced Networking (ENA) support</li>
        <li>Hardened Enterprise builds</li>
      </ul>

      <p className="opacity-80">
        Choose a tier below to continue.
      </p>
    </div>
  );
}
