import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFont } from "../api";

export default function FontDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { getFont(slug).then(setData).catch(console.error); }, [slug]);
  
  if (!data) return <p className="text-gray-500 text-center py-8">Loading font...</p>;
  
  const font = data.font || data;
  const metadata = data.metadata;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{font.name}</h1>
        <p className="text-gray-500 mt-1">by {font.foundry}</p>
      </div>

      {/* Specimen Preview */}
      <div className="card p-8">
        <div 
          className="text-5xl text-center py-12 text-gray-800"
          style={{ fontFamily: "Georgia, serif" }}
        >
          The quick brown fox jumps over the lazy dog
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">{font.description}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pricing */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="text-3xl font-bold text-indigo-600 mb-2">From ${font.price}</div>
          <p className="text-sm text-gray-500">Individual styles available</p>
          <button className="btn-primary w-full mt-4">Add to Cart</button>
        </div>

        {/* Metadata */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-900 capitalize">{font.category}</span>
            </div>
            {metadata?.mood_tags && (
              <div className="flex justify-between">
                <span className="text-gray-500">Style</span>
                <span className="text-gray-900">{metadata.mood_tags.join(", ")}</span>
              </div>
            )}
            {metadata?.weights_count && (
              <div className="flex justify-between">
                <span className="text-gray-500">Weights</span>
                <span className="text-gray-900">{metadata.weights_count} styles</span>
              </div>
            )}
            {metadata?.language_support && (
              <div className="flex justify-between">
                <span className="text-gray-500">Languages</span>
                <span className="text-gray-900">{metadata.language_support.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
