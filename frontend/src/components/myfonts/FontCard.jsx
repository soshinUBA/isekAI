import { Link } from "react-router-dom";

export default function FontCard({ font }) {
  return (
    <Link 
      to={"/fonts/" + font.slug} 
      className="card block hover:shadow-md transition-shadow duration-200 overflow-hidden group"
    >
      <div 
        className="h-32 flex items-center justify-center bg-gray-50 text-3xl text-gray-700 group-hover:bg-gray-100 transition-colors"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {font.name}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{font.name}</h3>
        <p className="text-sm text-gray-500">{font.foundry}</p>
        <p className="text-sm font-medium text-indigo-600 mt-2">From ${font.price}</p>
      </div>
    </Link>
  );
}
