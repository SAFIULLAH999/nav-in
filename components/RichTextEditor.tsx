'use client';

import { useState, useRef } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Link as LinkIcon, Image, Video, Code, Quote 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'your_preset'); // Cloudinary preset

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        document.execCommand('insertImage', false, data.secure_url);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Bold"
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Italic"
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Underline"
        >
          <Underline className="w-5 h-5" />
        </button>
        
        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Bullet List"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Numbered List"
        >
          <ListOrdered className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Insert Link"
        >
          <LinkIcon className="w-5 h-5" />
        </button>

        <label className="p-2 hover:bg-gray-200 rounded transition cursor-pointer" title="Insert Image">
          <Image className="w-5 h-5" alt="Insert image" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Quote"
        >
          <Quote className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'pre')}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Code Block"
        >
          <Code className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="px-2 py-1 border rounded hover:bg-gray-200 transition"
          defaultValue=""
        >
          <option value="">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="p-4 min-h-[400px] max-h-[600px] overflow-y-auto focus:outline-none prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
        }}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
      `}</style>
    </div>
  );
}
