import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Upload PDF</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <UploadForm />
        </div>
      </div>
    </main>
  );
}
