export default function DeploymentGuide() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Deployment Guide</h1>

      <p className="opacity-80 mb-4">
        Follow this guide to deploy DevVelocity images across any supported cloud provider.
      </p>

      <h2 className="text-2xl font-semibold mb-2">General Steps</h2>
      <ol className="list-decimal ml-6 space-y-2 mb-6">
        <li>Select a provider</li>
        <li>Choose an image tier</li>
        <li>Download or import the image</li>
        <li>Deploy via the provider’s console or CLI</li>
      </ol>

      <p className="opacity-80">
        Each provider will include its own dedicated instructions.
      </p>
    </div>
  );
}
