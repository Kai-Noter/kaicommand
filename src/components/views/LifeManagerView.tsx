import React, { useState, useEffect } from 'react';
import { Network, Building2, UserPlus, Briefcase, Plus, Search, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  location: string | null;
  businessId: string | null;
  business: Business | null;
}

interface Business {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  status: string;
}

interface LifeManagerViewProps {
  onNotify?: (msg: string, type: 'success' | 'error') => void;
}

export function LifeManagerView({ onNotify }: LifeManagerViewProps) {
  const [activeTab, setActiveTab] = useState<'people' | 'businesses'>('people');
  const [people, setPeople] = useState<Person[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Modal State
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/network');
      if (res.ok) {
        const data = await res.json();
        setPeople(data.persons || []);
        setBusinesses(data.businesses || []);
      }
    } catch (e) {
      console.error(e);
      if (onNotify) onNotify("Failed to load network data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePerson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'person',
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          role: formData.get('role'),
          company: formData.get('company'),
          location: formData.get('location'),
          email: formData.get('email'),
          phone: formData.get('phone'),
        })
      });
      
      if (res.ok) {
        setShowAddPerson(false);
        fetchNetwork();
        if (onNotify) onNotify("Contact added successfully", "success");
      }
    } catch (err) {
      if (onNotify) onNotify("Error adding contact", "error");
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'business',
          name: formData.get('name'),
          industry: formData.get('industry'),
          location: formData.get('location'),
        })
      });
      
      if (res.ok) {
        setShowAddBusiness(false);
        fetchNetwork();
        if (onNotify) onNotify("Business added successfully", "success");
      }
    } catch (err) {
      if (onNotify) onNotify("Error adding business", "error");
    }
  };

  const filteredPeople = people.filter(p => 
    `${p.firstName} ${p.lastName || ''} ${p.company || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredBusinesses = businesses.filter(b => 
    `${b.name} ${b.industry || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 pb-2">
            Life & Business Graph
          </h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Intelligent tracking of Malawian investments, contacts, and networks
          </p>
        </div>
        
        <div className="flex gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('people')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
              ${activeTab === 'people' ? 'bg-gradient-to-br from-lime-500 to-emerald-600 text-black shadow-lg shadow-lime-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Network className="w-4 h-4" /> Personnel
          </button>
          <button 
            onClick={() => setActiveTab('businesses')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
              ${activeTab === 'businesses' ? 'bg-gradient-to-br from-lime-500 to-emerald-600 text-black shadow-lg shadow-lime-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Building2 className="w-4 h-4" /> Enterprises
          </button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center shadow-xl"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'people' ? 'contacts, roles, companies' : 'businesses, industries'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all font-medium"
          />
        </div>
        
        <button 
          onClick={() => activeTab === 'people' ? setShowAddPerson(true) : setShowAddBusiness(true)}
          className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 hover:border-lime-500/50 hover:bg-lime-500/10 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all group shrink-0"
        >
          <Plus className="w-4 h-4 text-lime-400 group-hover:scale-125 transition-transform" />
          Add {activeTab}
        </button>
      </motion.div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-lime-500/20 border-t-lime-500 animate-spin" />
        </div>
      ) : activeTab === 'people' ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredPeople.map(person => (
              <motion.div 
                layout
                variants={itemVariants}
                key={person.id} 
                className="glass-card rounded-3xl p-6 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500/20 to-emerald-500/20 flex items-center justify-center border border-lime-500/30 shadow-inner group-hover:scale-105 transition-transform">
                        <span className="text-lime-400 font-bold text-lg">{person.firstName[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-lime-400 transition-colors">
                          {person.firstName} {person.lastName}
                        </h3>
                        {person.role && (
                          <p className="text-xs font-medium text-emerald-400/80 flex items-center gap-1.5 mt-1 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Briefcase className="w-3 h-3"/>
                            {person.role} {person.company ? `at ${person.company}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-white/5 space-y-3 text-sm text-gray-400 font-medium">
                    {person.location && <p className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs">📍</span> {person.location}</p>}
                    {person.email && <p className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs">✉️</span> {person.email}</p>}
                    {person.phone && <p className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs">📞</span> {person.phone}</p>}
                  </div>
                  
                  <button className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all hover:bg-lime-500/20 hover:text-lime-400 delay-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredPeople.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full flex flex-col items-center justify-center p-20 glass-card rounded-3xl border-dashed">
              <UserPlus className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm font-medium">No personnel found. Try adjusting your search.</p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filteredBusinesses.map(bus => (
              <motion.div 
                layout
                variants={itemVariants}
                key={bus.id} 
                className="glass-card rounded-3xl p-6 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                          <Building2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white group-hover:text-emerald-400 transition-colors">
                            {bus.name}
                          </h3>
                          {bus.industry && <p className="text-sm font-medium text-emerald-500/70 mt-0.5">{bus.industry}</p>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase ${bus.status === 'active' ? 'text-lime-400 shadow-[0_0_10px_rgba(132,204,22,0.2)]' : 'text-gray-400'}`}>
                        {bus.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                      <span className="opacity-50">📍</span> {bus.location || 'Location Not Set'}
                    </p>
                    <button className="text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-400 flex items-center gap-1">
                      View details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredBusinesses.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full flex flex-col items-center justify-center p-20 glass-card rounded-3xl border-dashed">
              <Building2 className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm font-medium">No enterprises found in the registry.</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Add Person Modal */}
      <AnimatePresence>
      {showAddPerson && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#0f1115] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500" />
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white tracking-tight">Add Contact</h3>
              <button onClick={() => setShowAddPerson(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleCreatePerson} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">First Name</label>
                  <input required name="firstName" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Last Name</label>
                  <input name="lastName" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Role</label>
                  <input name="role" placeholder="Farm Manager" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Company</label>
                  <input name="company" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Email</label>
                  <input type="email" name="email" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Phone</label>
                  <input name="phone" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Location</label>
                <input name="location" placeholder="Lilongwe, Malawi" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all focus:border-emerald-500/50" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddPerson(false)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transform transition-all hover:scale-105">Save Contact</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Add Business Modal */}
      <AnimatePresence>
      {showAddBusiness && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#0f1115] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-lime-500" />
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white tracking-tight">Add Enterprise</h3>
              <button onClick={() => setShowAddBusiness(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleCreateBusiness} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Business Name</label>
                <input required name="name" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-lime-500/50 outline-none transition-all focus:border-lime-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Industry</label>
                  <input name="industry" placeholder="Agriculture" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-lime-500/50 outline-none transition-all focus:border-lime-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-gray-500 ml-1">Location</label>
                  <input name="location" placeholder="Mzuzu, Malawi" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-lime-500/50 outline-none transition-all focus:border-lime-500/50" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddBusiness(false)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black rounded-xl text-sm font-bold shadow-lg shadow-lime-500/20 transform transition-all hover:scale-105">Save Enterprise</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
