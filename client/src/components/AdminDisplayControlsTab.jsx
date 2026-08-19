import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Sliders, Crown, BookOpen, Clock, Eye, EyeOff, CheckCircle2,
  GripVertical
} from 'lucide-react';

const SECTION_DEFS = {
  leaderboard: {
    id: 'leaderboard',
    name: 'Leaderboard Section',
    description: "Today's Top Leaders ranking list on Home page.",
    icon: Crown,
    toggleKey: 'showLeaderboard',
    iconColor: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/20',
    activeBg: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-xs',
    dragOverBorder: 'border-amber-500 bg-amber-500/15',
  },
  swalath: {
    id: 'swalath',
    name: 'Arabic Swalath Display',
    description: 'Featured Arabic Swalath card on Home page.',
    icon: BookOpen,
    toggleKey: 'showSwalath',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    activeBg: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50',
    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-xs',
    dragOverBorder: 'border-emerald-500 bg-emerald-500/15',
  },
  prayerTimes: {
    id: 'prayerTimes',
    name: 'Prayer Times Widget',
    description: 'Daily Namaz time card (ഫജ്ർ, ദുഹ്ർ, അസ്ർ, മഗ്‌രിബ്, ഇശ) on Home page.',
    icon: Clock,
    toggleKey: 'showPrayerTimes',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    activeBg: 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50',
    badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-xs',
    dragOverBorder: 'border-indigo-500 bg-indigo-500/15',
  },
};

export default function AdminDisplayControlsTab({
  displaySettings,
  handleToggleDisplaySetting,
  handleReorderSections,
  saveSuccess,
  error,
}) {
  const defaultOrder = ['leaderboard', 'swalath', 'prayerTimes'];
  const rawOrder = Array.isArray(displaySettings?.homeSectionOrder) && displaySettings.homeSectionOrder.length
    ? displaySettings.homeSectionOrder
    : defaultOrder;

  const initialOrder = [
    ...rawOrder.filter((id) => SECTION_DEFS[id]),
    ...defaultOrder.filter((id) => !rawOrder.includes(id)),
  ];

  const [order, setOrder] = useState(initialOrder);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const freshOrder = Array.isArray(displaySettings?.homeSectionOrder) && displaySettings.homeSectionOrder.length
      ? displaySettings.homeSectionOrder
      : defaultOrder;
    setOrder([
      ...freshOrder.filter((id) => SECTION_DEFS[id]),
      ...defaultOrder.filter((id) => !freshOrder.includes(id)),
    ]);
  }, [displaySettings?.homeSectionOrder]);

  // ── Drag Handlers ──
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {}
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch (err) {}
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();

    let fromIndex = draggedIndex;
    if (fromIndex === null) {
      const data = e.dataTransfer.getData('text/plain');
      if (data !== '') fromIndex = parseInt(data, 10);
    }

    if (fromIndex === null || isNaN(fromIndex) || fromIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...order];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);

    setOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (handleReorderSections) {
      handleReorderSections(newOrder);
    }
  };

  const handleDragEnd = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ── Touch Drag Support ──
  const touchState = useRef({ startIndex: null, active: false });

  const handleTouchStart = (index) => {
    touchState.current = { startIndex: index, active: true };
    setDraggedIndex(index);
  };

  const handleTouchMove = (e) => {
    if (!touchState.current.active) return;
    const touch = e.touches[0];
    if (!touch) return;

    cardRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        if (dragOverIndex !== idx) {
          setDragOverIndex(idx);
        }
      }
    });
  };

  const handleTouchEnd = () => {
    if (!touchState.current.active) return;
    const fromIndex = touchState.current.startIndex;
    const targetIndex = dragOverIndex;

    touchState.current = { startIndex: null, active: false };

    if (fromIndex !== null && targetIndex !== null && fromIndex !== targetIndex) {
      const newOrder = [...order];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(targetIndex, 0, movedItem);

      setOrder(newOrder);
      if (handleReorderSections) {
        handleReorderSections(newOrder);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Card className="border border-primary/20 shadow-md">
      <CardContent className="p-6 space-y-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <span>Home Page Section Controllers (വിഭാഗങ്ങൾ ക്രമീകരിക്കുക)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag cards to reorder how they appear on the Home page. Toggle visibility for each section.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            Drag to Reorder
          </Badge>
        </div>

        {saveSuccess && (
          <Alert variant="success" className="flex items-center gap-2 text-xs py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </Alert>
        )}
        {error && <Alert variant="destructive" className="text-xs py-2.5">{error}</Alert>}

        {/* 3-Column Card Grid with Distinct Colors & Drag-and-Drop */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {order.map((sectionId, index) => {
            const def = SECTION_DEFS[sectionId];
            if (!def) return null;
            const Icon = def.icon;
            const isVisible = displaySettings[def.toggleKey] !== false;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={sectionId}
                ref={(el) => (cardRefs.current[index] = el)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={() => handleTouchStart(index)}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                  transition: 'transform 200ms ease-out, opacity 200ms ease-out, border-color 200ms ease-out, background-color 200ms ease-out',
                }}
                className={`p-4 rounded-2xl border space-y-3 select-none cursor-grab active:cursor-grabbing relative ${
                  isDragging
                    ? 'opacity-30 border-dashed border-2 border-primary scale-[0.98]'
                    : isDragOver
                    ? `border-2 ${def.dragOverBorder} shadow-lg scale-[1.02]`
                    : isVisible
                    ? `${def.activeBg} shadow-xs`
                    : 'bg-muted/30 border-border opacity-70 hover:opacity-90'
                }`}
              >
                {/* Header: Icon, Position, & Visibility Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground p-0.5">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className={`w-9 h-9 rounded-xl ${def.bgColor} flex items-center justify-center font-bold text-xs shadow-xs`}>
                      <Icon className={`w-5 h-5 ${def.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded-md ${isVisible ? def.badgeBg : 'bg-muted/60 text-muted-foreground'}`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Toggle Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant={isVisible ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDisplaySetting(def.toggleKey);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`rounded-xl h-8 text-xs font-bold gap-1.5 cursor-pointer z-10 ${
                      isVisible ? def.buttonClass : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Body */}
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {def.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {def.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
