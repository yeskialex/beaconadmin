'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Upload,
  Link as LinkIcon,
  Unlink
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'newsletter-image',
          style: 'max-width: 100%; height: auto; display: block; margin: 20px auto;'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'newsletter-link',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      // Send clean HTML that Flutter can render
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] max-w-none p-4',
        style: 'color: black;'
      }
    },
    immediatelyRender: false // Fix SSR hydration issue
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use API endpoint that has admin authentication
      const response = await fetch('/api/newsletters/upload-content-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Upload error:', error)
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB')
        return
      }

      setIsUploading(true)
      try {
        const imageUrl = await uploadImage(file)
        if (imageUrl && editor) {
          editor.chain().focus().setImage({ src: imageUrl }).run()
        } else {
          alert('Failed to upload image')
        }
      } catch (error) {
        alert('Error uploading image')
      } finally {
        setIsUploading(false)
      }
    }
    input.click()
  }, [editor])

  const handleAddLink = useCallback(() => {
    const selection = editor?.state.selection
    const selectedText = editor?.state.doc.textBetween(selection?.from || 0, selection?.to || 0)

    setLinkText(selectedText || '')
    setLinkUrl('')
    setShowLinkDialog(true)
  }, [editor])

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return

    if (!linkUrl) {
      setShowLinkDialog(false)
      return
    }

    // Add protocol if missing
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`

    if (linkText) {
      // If there's link text, insert it with the link
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`).run()
    } else {
      // If text is selected, make it a link
      editor.chain().focus().setLink({ href: url }).run()
    }

    setShowLinkDialog(false)
    setLinkUrl('')
    setLinkText('')
  }, [editor, linkUrl, linkText])

  const handleRemoveLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Heading 1 (Large)"
            >
              <Heading1 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Heading 2 (Medium)"
            >
              <Heading2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Heading 3 (Small)"
            >
              <Heading3 className="h-5 w-5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'text-black'}`}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={handleAddLink}
              className={`p-2 rounded hover:bg-gray-200 text-black`}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemoveLink}
              className={`p-2 rounded hover:bg-gray-200 text-black`}
              title="Remove Link"
            >
              <Unlink className="h-4 w-4" />
            </button>
          </div>

          {/* Image and History */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={isUploading}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 text-black"
              title="Insert Image"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-pulse text-blue-600" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:text-gray-400 text-black"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:text-gray-400 text-black"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Font Size Helper Text */}
        <div className="flex items-center mt-2 space-x-2">
          <span className="text-xs text-gray-500">
            💡 Use heading buttons (H1, H2, H3) above for different text sizes
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white">
        <EditorContent
          editor={editor}
          className="newsletter-editor"
          placeholder={placeholder}
        />
      </div>

      {/* Helper Text */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-500">
        <p>💡 Tip: You can insert images and links anywhere in your content. The formatting will be preserved when viewed in the mobile app.</p>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Link</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter link text or leave empty to use selected text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com or example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false)
                  setLinkUrl('')
                  setLinkText('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .newsletter-editor .ProseMirror {
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
        }
        .newsletter-editor .ProseMirror p {
          margin: 1em 0;
        }
        .newsletter-editor .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0;
        }
        .newsletter-editor .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0;
        }
        .newsletter-editor .ProseMirror h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin: 1em 0;
        }
        .newsletter-editor .ProseMirror ul,
        .newsletter-editor .ProseMirror ol {
          padding-left: 2em;
          margin: 1em 0;
        }
        .newsletter-editor .ProseMirror li {
          margin: 0.5em 0;
        }
        .newsletter-editor .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
        .newsletter-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 20px auto;
          border-radius: 8px;
        }
        .newsletter-editor .ProseMirror:focus {
          outline: none;
        }
        .newsletter-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .newsletter-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        .newsletter-editor .ProseMirror a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}