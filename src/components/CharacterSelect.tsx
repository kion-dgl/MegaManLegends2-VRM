import { h } from 'preact';
import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { selectedCharacter } from '../stores/characterStore';

interface Character {
  name: string;
  file: string;
}

const characters = [
  { name: "MegaMan", file: "PL00.BIN" },
  { name: "Roll", file: "PL01.BIN" },
  { name: "Tron", file: "PL02.BIN" }
]

export function CharacterSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Character | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


  const handleSelect = useCallback((character: Character) => {
    setSelected(character);
    setIsOpen(false);
    console.log(character)
    selectedCharacter.set(character);
  }, []);

  // Handle clicking outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-[5px] left-[5px] w-[240px] z-50`}
    >
      <div className="relative">
        {/* Selected Value Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-md shadow-sm 
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {selected ? selected.name : 'Select Character'}
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {characters.map((character) => (
              <div
                key={character.file}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(character);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
              >
                {character.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}