import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Phone, Mail, Trash2, Camera, X, Edit2, Share2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  photo: string | null;
  relation: string | null;
  createdAt: string;
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [relation, setRelation] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the base URL for the API
  const getApiUrl = (path: string) => {
    // In Capacitor/Mobile, we might need the full URL if not using a proxy
    // For this environment, relative paths work in web, but full paths are safer for APKs
    const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('.run.app')
      ? '' 
      : 'https://ais-pre-4xqjhd5pssp5ofagp3psej-396154476455.asia-east1.run.app'; // Use the Shared App URL as fallback
    return `${baseUrl}${path}`;
  };

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/contacts?search=${encodeURIComponent(searchQuery)}`));
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [searchQuery]);

  const filteredContacts = contacts; // Filtering is handled by the API now

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // If the user is trying to delete the prefix, let them clear the whole thing
    if (phone.startsWith('+91') && !val.startsWith('+91')) {
      setPhone('');
      return;
    }

    // Extract the part after the prefix
    let rawInput = val;
    if (val.startsWith('+91 ')) {
      rawInput = val.slice(4);
    } else if (val.startsWith('+91')) {
      rawInput = val.slice(3);
    } else if (val.startsWith('91') && val.length > 10) {
      // Handle cases where user pastes a number starting with 91 without +
      rawInput = val.slice(2);
    }
    
    // Get only digits from the raw input
    const digits = rawInput.replace(/\D/g, '').slice(0, 10);
    
    if (digits.length === 0) {
      setPhone(val.length > 0 ? '+91 ' : '');
    } else if (digits.length > 5) {
      setPhone(`+91 ${digits.slice(0, 5)} ${digits.slice(5)}`);
    } else {
      setPhone(`+91 ${digits}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) return;

    try {
      const url = editingContact ? getApiUrl(`/api/contacts/${editingContact.id}`) : getApiUrl('/api/contacts');
      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, photo, relation }),
      });

      if (response.ok) {
        resetForm();
        fetchContacts();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPhoto(null);
    setRelation('');
    setIsAdding(false);
    setEditingContact(null);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setEmail(contact.email);
    setPhoto(contact.photo);
    setRelation(contact.relation || '');
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/api/contacts/${id}`), { method: 'DELETE' });
      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleShare = async (contact: Contact) => {
    const shareText = `Name: ${contact.name}\nPhone: ${contact.phone}\nEmail: ${contact.email}${contact.relation ? `\nRelation: ${contact.relation}` : ''}`;
    const shareData = {
      title: 'Contact Details',
      text: shareText,
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Contact details copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy contact details.');
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        // 'AbortError' means the user manually closed the share dialog
        if (err.name === 'AbortError') {
          return;
        }
        // For other errors (like permission issues in some browsers), fallback to clipboard
        console.warn('Native share failed, falling back to clipboard:', err);
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">NexaBook</h1>
            <p className="text-stone-500 mt-1">Manage your connections effortlessly.</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-2xl hover:bg-stone-800 transition-all shadow-md active:scale-95"
          >
            <UserPlus size={20} />
            <span>Add Contact</span>
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, email, or relation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all shadow-sm"
          />
        </div>

        {/* Contact List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group relative"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                    {contact.photo ? (
                      <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Camera size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">{contact.name}</h3>
                      {contact.relation && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-stone-200">
                          {contact.relation}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 mt-1 text-sm">
                      <Phone size={14} />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 mt-0.5 text-sm">
                      <Mail size={14} />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 uppercase tracking-wider font-medium">
                      Added {new Date(contact.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-1">
                  <button
                    onClick={() => handleShare(contact)}
                    title="Share Contact"
                    className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(contact)}
                    title="Edit Contact"
                    className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    title="Delete Contact"
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredContacts.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No contacts found</h3>
            <p className="text-stone-500">Try adjusting your search or add a new contact.</p>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-center mb-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-3xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-stone-900 transition-colors group overflow-hidden"
                  >
                    {photo ? (
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="text-stone-400 group-hover:text-stone-900 transition-colors" size={32} />
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Relation</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="text"
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      placeholder="Family, Friend, Work..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  {editingContact && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingContact.id);
                        resetForm();
                      }}
                      className="flex-1 bg-red-50 text-red-600 py-4 rounded-xl font-semibold hover:bg-red-100 transition-all active:scale-[0.98] border border-red-200"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-[2] bg-stone-900 text-white py-4 rounded-xl font-semibold hover:bg-stone-800 transition-all active:scale-[0.98] shadow-lg"
                  >
                    {editingContact ? 'Update Contact' : 'Save Contact'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
