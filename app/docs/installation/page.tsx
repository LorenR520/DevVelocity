export default function Installation() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Installation</h1>

      <p className="opacity-70 mb-4">
        This guide walks you through installing and configuring DevVelocity images across supported cloud providers.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Prerequisites</h2>
      <ul className="list-disc ml-6 opacity-80 space-y-1">
        <li>A valid DevVelocity account</li>
        <li>Cloud provider account (AWS, Azure, GCP, OCI)</li>
        <li>Basic command-line familiarity</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Install Steps</h2>
      <ol className="list-decimal ml-6 opacity-80 space-y-1">
        <li>Choose a cloud provider</li>
        <li>Select a tiered image (Sandbox, Developer, Enterprise)</li>
        <li>Copy the deployment script displayed on the image page</li>
        <li>Run the script in your cloud environment</li>
      </ol>
    </div>
  );
}
