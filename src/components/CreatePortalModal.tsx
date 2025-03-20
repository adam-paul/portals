import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LockIcon } from 'lucide-react';
import WorldVisualizer from './WorldVisualizer';

interface PortalPosition { x: number; y: number; z: number }
interface FormData {
  title: string;
  description: string;
  url: string;
  color: string;
  glowColor: string;
  coreColor: string;
  position: PortalPosition;
  radius: number;
}

const CreatePortalModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', url: '', color: '#ffffaa', glowColor: '#ffffcc', coreColor: '#ffffff',
    position: { x: 0, y: 0, z: 0 }, radius: 20,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('position.')) {
      const posKey = name.split('.')[1] as keyof PortalPosition;
      setFormData(prev => ({
        ...prev,
        position: { ...prev.position, [posKey]: parseFloat(value) || 0 },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePositionChange = (pos: PortalPosition) => {
    setFormData(prev => ({ ...prev, position: pos }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting portal:', formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-white/70 hover:text-white text-lg font-bold tracking-wider transition-all duration-300" aria-label="Create a portal to your world">
          Create a Portal to Your World
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-black/90 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white tracking-wider font-bold">Create a Portal to Your World</DialogTitle>
          <DialogDescription className="text-white/70">Submit your game to be featured in the Portals collection</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                  Game Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="bg-black/50 border-gray-700 text-white"
                  placeholder="My Amazing Game"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Game Description
                </label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-black/50 border-gray-700 text-white"
                  placeholder="A brief description of your game"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-white mb-2">
                  Game URL
                </label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  className="bg-black/50 border-gray-700 text-white"
                  placeholder="https://yourgame.com/"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-white mb-2">
                    Portal Color
                  </label>
                  <div className="flex">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={handleChange}
                      name="color"
                      className="ml-2 flex-grow bg-black/50 border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="glowColor" className="block text-sm font-medium text-white mb-2">
                    Glow Color
                  </label>
                  <div className="flex">
                    <Input
                      id="glowColor"
                      name="glowColor"
                      type="color"
                      value={formData.glowColor}
                      onChange={handleChange}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={formData.glowColor}
                      onChange={handleChange}
                      name="glowColor"
                      className="ml-2 flex-grow bg-black/50 border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="coreColor" className="block text-sm font-medium text-white mb-2">
                    Core Color
                  </label>
                  <div className="flex">
                    <Input
                      id="coreColor"
                      name="coreColor"
                      type="color"
                      value={formData.coreColor}
                      onChange={handleChange}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={formData.coreColor}
                      onChange={handleChange}
                      name="coreColor"
                      className="ml-2 flex-grow bg-black/50 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-white mb-2">
                  Portal Radius
                </label>
                <div className="flex items-center">
                  <Input
                    id="radius"
                    name="radius"
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={formData.radius}
                    onChange={handleChange}
                    className="w-full bg-black/50 h-2"
                    disabled
                  />
                  <span className="ml-2 w-10 text-center text-white/70">{formData.radius}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="ml-2 bg-black/50 border-gray-700"
                    disabled
                  >
                    <LockIcon className="h-4 w-4 text-yellow-500" />
                  </Button>
                  <div className="ml-2 text-xs text-yellow-500">Premium feature</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="position.x" className="block text-sm font-medium text-white mb-2">
                    Position X
                  </label>
                  <Input
                    id="position.x"
                    name="position.x"
                    type="number"
                    value={formData.position.x}
                    onChange={handleChange}
                    className="bg-black/50 border-gray-700 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="position.y" className="block text-sm font-medium text-white mb-2">
                    Position Y
                  </label>
                  <Input
                    id="position.y"
                    name="position.y"
                    type="number"
                    value={formData.position.y}
                    onChange={handleChange}
                    className="bg-black/50 border-gray-700 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="position.z" className="block text-sm font-medium text-white mb-2">
                    Position Z
                  </label>
                  <Input
                    id="position.z"
                    name="position.z"
                    type="number"
                    value={formData.position.z}
                    onChange={handleChange}
                    className="bg-black/50 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="h-[500px] world-visualizer-container rounded-lg overflow-hidden bg-black/30 border border-gray-800">
              {open && (
                <WorldVisualizer
                  position={formData.position}
                  radius={formData.radius}
                  color={formData.color}
                  glowColor={formData.glowColor}
                  coreColor={formData.coreColor}
                  onPositionChange={handlePositionChange}
                />
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit for Approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePortalModal;