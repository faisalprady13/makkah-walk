"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import type { Location } from "@/domain/entities/location";
import type { GeocodingProvider } from "@/domain/interfaces/geocoding-provider";
import { Button } from "@/components/ui/button";

interface LocationSearchFieldProps {
  label: string;
  placeholder: string;
  selected: Location | null;
  geocodingProvider: GeocodingProvider;
  onSelect: (location: Location | null) => void;
  inputId: string;
}

export function LocationSearchField({
  label,
  placeholder,
  selected,
  geocodingProvider,
  onSelect,
  inputId,
}: LocationSearchFieldProps) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = `${inputId}-suggestions`;

  useEffect(() => {
    if (!isOpen || query.trim().length < 2 || selected?.name === query) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await geocodingProvider.searchLocations(query);
        if (!cancelled) {
          setSuggestions(results);
          setActiveIndex(-1);
        }
      } catch {
        if (!cancelled) {
          setError("Search is unavailable. Please try again.");
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [geocodingProvider, isOpen, query, selected?.name]);

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  function chooseLocation(location: Location) {
    onSelect(location);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const location = suggestions[activeIndex];
      if (location) chooseLocation(location);
    }
  }

  function handleChange(value: string) {
    setQuery(value);
    setIsOpen(true);
    setError(null);
    setSuggestions([]);
    setIsLoading(false);
    if (selected) onSelect(null);
  }

  return (
    <div className="search-field" ref={wrapperRef}>
      <label className="search-field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="search-input-wrap">
        <Search aria-hidden="true" className="search-input-icon" size={17} />
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen && query.trim().length >= 2}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          value={selected?.name ?? query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="search-clear"
            aria-label={`Clear ${label}`}
            onClick={() => {
              handleChange("");
              setSuggestions([]);
            }}
          >
            <X size={15} />
          </Button>
        )}
      </div>
      {isOpen && query.trim().length >= 2 && (
        <div className="suggestion-popover">
          {isLoading ? (
            <p className="suggestion-message" role="status">
              Searching sample places…
            </p>
          ) : error ? (
            <p className="suggestion-message suggestion-error" role="alert">
              {error}
            </p>
          ) : suggestions.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label={`${label} suggestions`}>
              {suggestions.map((location, index) => (
                <li
                  key={location.id}
                >
                  <button
                    id={`${listboxId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={`suggestion-option ${
                      activeIndex === index ? "suggestion-active" : ""
                    }`}
                    onClick={() => chooseLocation(location)}
                  >
                    <span className="suggestion-icon">
                      <MapPin size={16} aria-hidden="true" />
                    </span>
                    <span className="suggestion-copy">
                      <span>{location.name}</span>
                      <small>{location.address}</small>
                    </span>
                    <span className="suggestion-category">
                      {location.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="suggestion-message">
              No sample places found. Try a landmark or hotel in Makkah.
            </p>
          )}
          <p className="suggestion-footnote">Illustrative sample locations</p>
        </div>
      )}
    </div>
  );
}
