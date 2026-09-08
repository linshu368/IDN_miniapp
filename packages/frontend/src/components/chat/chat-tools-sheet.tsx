'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
  ChevronLeft,
  ImageIcon,
  MessagesSquare,
  Mic,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { FeatureUnavailablePanel } from '@/components/market/feature-unavailable';
import { cn } from '@/lib/utils';
import { useModelCatalogQuery } from '@/lib/api/models';
import { isMarketFeatureEnabled } from '@/lib/market-features';
import { ChatGenerationSettings } from './chat-generation-settings';
import { ChatModelSwitcher } from './chat-model-switcher';
import { ToolRow } from './chat-tool-row';
import { ChatVoicePicker, ChatVoiceSettings } from './chat-voice-settings';

type ToolsTab = 'chat' | 'voice' | 'image';
/** null = 停在一级页；非空时整个抽屉换成对应的二级页，带返回 */
type ToolsPanel = 'model' | 'generation' | 'voice' | null;

const PANEL_TITLES: Record<Exclude<ToolsPanel, null>, string> = {
  model: 'Pilih model',
  generation: 'Preferensi generate',
  voice: 'Suara default',
};

const PANEL_DESCRIPTIONS: Record<Exclude<ToolsPanel, null>, string> = {
  model: 'Pilih model untuk chat',
  generation: 'Atur panjang balasan dan instruksi kustom',
  voice: 'Pilih suara karakter',
};

const TABS: { key: ToolsTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'chat', label: 'Pengaturan chat', icon: MessagesSquare },
  { key: 'voice', label: 'Pengaturan suara', icon: Mic },
  { key: 'image', label: 'Pengaturan gambar', icon: ImageIcon },
];

interface ChatToolsSheetProps {
  /** 充值页返回时要回到的地址，带上当前会话 */
  returnTo: string;
  onCreateConversation: () => void;
  creating: boolean;
}

/**
 * 输入框左侧的工具箱。按钮和抽屉放在同一个组件里：开合状态没有第二个使用者，
 * 抽屉自己走 portal，挂在输入框的左槽里不会被胶囊的圆角裁掉。
 */
export function ChatToolsSheet({ returnTo, onCreateConversation, creating }: ChatToolsSheetProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ToolsTab>('chat');
  const [panel, setPanel] = useState<ToolsPanel>(null);
  const { data: catalog } = useModelCatalogQuery();

  // 关上再打开应当回到一级页，否则下次进来会直接落在上次翻到的二级页里
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => {
      setPanel(null);
      setTab('chat');
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open]);

  const selectedModelName = catalog?.catalog.tiers
    .flatMap((tier) => tier.models)
    .find((model) => model.id === catalog.selected_model_id)?.display_name;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Perkakas"
        className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
      >
        <WandSparkles className="size-5" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="chat-scroll-area max-h-[82vh] overflow-y-auto rounded-t-3xl border-border bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-5"
        >
          {panel === null ? (
            <>
              <SheetTitle className="text-[16px] font-bold text-foreground">Perkakas</SheetTitle>
              <SheetDescription className="mt-0.5 text-[12px] text-muted-foreground">
                Model dan preferensi generate berlaku untuk semua karakter kamu
              </SheetDescription>

              <div className="my-4 flex gap-1 rounded-full bg-muted p-1">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-medium transition-colors',
                      tab === item.key
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="size-3.5" aria-hidden />
                    {item.label}
                  </button>
                ))}
              </div>

              {tab === 'chat' ? (
                <div className="space-y-2">
                  <ToolRow
                    icon={Sparkles}
                    title="Pilih model"
                    hint={selectedModelName ?? 'Pilih model untuk percakapan ini'}
                    onClick={() => setPanel('model')}
                  />
                  <ToolRow
                    icon={MessagesSquare}
                    title="Obrolan baru"
                    hint="Simpan yang ini, mulai percakapan baru dari awal"
                    pending={creating}
                    onClick={() => {
                      setOpen(false);
                      onCreateConversation();
                    }}
                  />
                  <ToolRow
                    icon={SlidersHorizontal}
                    title="Preferensi generate"
                    hint="Panjang balasan, opsi di akhir, instruksi kustom"
                    onClick={() => setPanel('generation')}
                  />
                </div>
              ) : tab === 'voice' ? (
                isMarketFeatureEnabled('voice') ? (
                  <ChatVoiceSettings onOpenVoicePicker={() => setPanel('voice')} />
                ) : (
                  <FeatureUnavailablePanel kind="voice" />
                )
              ) : (
                <FeatureUnavailablePanel kind="image" />
              )}
            </>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Kembali ke perkakas"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <SheetTitle className="text-[16px] font-bold text-foreground">
                  {PANEL_TITLES[panel]}
                </SheetTitle>
              </div>
              <SheetDescription className="sr-only">{PANEL_DESCRIPTIONS[panel]}</SheetDescription>

              {panel === 'model' ? (
                <ChatModelSwitcher returnTo={returnTo} onSwitched={() => setOpen(false)} />
              ) : panel === 'voice' && isMarketFeatureEnabled('voice') ? (
                // 选完音色回一级页，而不是关掉整个抽屉：用户接着可能要调倍速
                <ChatVoicePicker onPicked={() => setPanel(null)} />
              ) : panel === 'voice' ? (
                <FeatureUnavailablePanel kind="voice" />
              ) : (
                <ChatGenerationSettings />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
