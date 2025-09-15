import React from 'react';
import { useSearchParams } from 'react-router-dom';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <div className="container">
      <h1>Search Results</h1>
      <p>Search query: {query}</p>
      <p>This page will show search results for the query.</p>
    </div>
  );
};

export default Search;
