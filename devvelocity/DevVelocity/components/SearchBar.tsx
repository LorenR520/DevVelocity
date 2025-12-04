"use client";

import { useState } from "react";
import { SEARCH_INDEX } from "../app/search/search-data";
import Link from "next/link";
import { IoSearch } from "react-icons/io5";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);

  const filtered = SEARCH_INDEX.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2">
        <IoSearch size={18} className="text-gray-400" />
        <input
          type="text"
          className="flex-1 bg-transparent outline-none px-2 text-sm dark:text-white"
          placeholder="Search docs, providers, guides..."
          value={query}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 200)}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {(focus && query.length > 0) && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-3 text-gray-500 text-sm">
              No results found.
            </div>
          )}

          {filtered.map((item, index) => (
            <Link
              key={index}
              href={item.url}
              className="block p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 border-b border-gray-100 dark:border-neutral-800"
            >
              <div className="font-medium text-sm dark:text-white">
                {item.title}
              </div>
              <div className="text-xs text-gray-500">
                {item.category}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
