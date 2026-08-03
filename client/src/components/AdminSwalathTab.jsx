import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Upload, Sparkles } from 'lucide-react';
import SwalathCard from './SwalathCard.jsx';

export default function AdminSwalathTab({
  swalathForm,
  setSwalathForm,
  handleUpdateSwalath,
  handleFileUpload,
  saveSuccess,
  error,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Manage Arabic Swalath</span>
            </h2>
            <Badge variant="muted" className="text-[10px] font-mono">Home Page Display</Badge>
          </div>

          {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
          {error && <Alert variant="destructive">{error}</Alert>}

          {/* Quick Presets */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Quick Swalath Presets (ക്വിക്ക് സെലക്ഷൻ)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSwalathForm((prev) => ({
                  ...prev,
                  title: 'ഹ്രസ്വ സ്വലാത്ത്',
                  arabicText: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ وَبَارِكْ وَسَلِّمْ',
                  translation: 'അല്ലാഹുവേ, ഞങ്ങളുടെ നേതാവ് മുഹമ്മദ് നബിയുടെ മേലിലും കുടുംബത്തിന്റെ മേലിലും നീ സ്വലാത്തും സലാമും ബറകത്തും ചൊരിയേണമേ.'
                }))}
                className="text-xs justify-start h-auto py-2 px-3 rounded-xl font-extrabold"
              >
                Short Swalath
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSwalathForm((prev) => ({
                  ...prev,
                  title: 'സ്വലാത്ത് ഇബ്രാഹിമിയ്യ',
                  arabicText: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
                  translation: 'ഇബ്രാഹീം നബിയുടെ മേലിലും കുടുംബത്തിന്റെ മേലിലും നീ അനുഗ്രഹം ചൊരിഞ്ഞത് പോലെ മുഹമ്മദ് നബിയുടെ മേലിലും കുടുംബത്തിന്റെ മേലിലും നീ അനുഗ്രഹം ചൊരിയേണമേ.'
                }))}
                className="text-xs justify-start h-auto py-2 px-3 rounded-xl font-extrabold"
              >
                Swalath Ibrahimiyya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSwalathForm((prev) => ({
                  ...prev,
                  title: 'സ്വലാത്തുൽ ഫാതിഹ്',
                  arabicText: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ وَالْخَاتِمِ لِمَا سَبَقَ نَاصِرِ الْحَقِّ بِالْحَقِّ وَالْهَادِي إِلَى صِرَاطِكَ الْمُسْتَقِيمِ وَعَلَى آلِهِ حَقَّ قَدْرِهِ وَمِقْدَارِهِ الْعَظِيمِ',
                  translation: 'അടക്കപ്പെട്ടവയെ തുറന്നവനും കഴിഞ്ഞുപോയവയ്ക്ക് സമാപനം കുറിച്ചവനും സത്യത്തെ സത്യം കൊണ്ട് സഹായിച്ചവനുമായ മുഹമ്മദ് നബിയുടെ മേൽ സ്വലാത്ത് ചൊരിയേണമേ.'
                }))}
                className="text-xs justify-start h-auto py-2 px-3 rounded-xl font-extrabold"
              >
                Swalathul Fatih
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSwalathForm((prev) => ({
                  ...prev,
                  title: 'സ്വലാത്തുന്നാരിയ്യ',
                  arabicText: 'اللَّهُمَّ صَلِّ صَلاَةً كَامِلَةً وَسَلِّمْ سَلاَماً تَاكًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ وَتُقْضَى بِهِ الْحَوِائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِمِ وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ وَعَلَى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ',
                  translation: 'പ്രയാസങ്ങൾ നീങ്ങുന്നതും പ്രയാസങ്ങൾ അകലുന്നതും ആവശ്യങ്ങൾ പൂർത്തീകരിക്കപ്പെടുന്നതുമായ മുഹമ്മദ് നബിയുടെ മേൽ പൂർണ്ണ സ്വലാത്ത് ചൊരിയേണമേ.'
                }))}
                className="text-xs justify-start h-auto py-2 px-3 rounded-xl font-extrabold"
              >
                Swalathun Nariyya
              </Button>
            </div>
          </div>

          <form onSubmit={handleUpdateSwalath} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Swalath Title (തലക്കെട്ട്)</Label>
              <Input
                type="text"
                placeholder="സ്വലാത്ത്"
                value={swalathForm.title}
                onChange={(e) => setSwalathForm({ ...swalathForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center justify-between">
                <span>Arabic Text (അറബിക് വാചകം) *</span>
                <span className="text-[10px] text-primary font-bold">RTL Arabic Input</span>
              </Label>
              <textarea
                dir="rtl"
                rows={4}
                placeholder="അറബിക് സ്വലാത്ത് ഇവിടെ ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ പേസ്റ്റ് ചെയ്യുക..."
                value={swalathForm.arabicText}
                onChange={(e) => setSwalathForm({ ...swalathForm, arabicText: e.target.value })}
                className="w-full font-arabic text-xl p-3.5 rounded-2xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Translation / Description (അർത്ഥം / വിവരണം)</Label>
              <textarea
                rows={3}
                placeholder="സ്വലാത്തിന്റെ അർത്ഥമോ മറ്റ് വിശദാംശങ്ങളോ നൽകാം..."
                value={swalathForm.translation}
                onChange={(e) => setSwalathForm({ ...swalathForm, translation: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Image Attachment / Upload */}
            <div className="space-y-2 pt-1 border-t border-border/50">
              <Label className="flex items-center gap-1.5 text-xs font-extrabold">
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload Swalath Image / Document (ഓപ്ഷണൽ ചിത്രങ്ങൾ)</span>
              </Label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <span className="text-[11px] text-muted-foreground font-bold shrink-0">OR</span>
                <Input
                  type="url"
                  placeholder="Paste Image URL..."
                  value={swalathForm.imageUrl}
                  onChange={(e) => setSwalathForm({ ...swalathForm, imageUrl: e.target.value })}
                  className="text-xs"
                />
              </div>
              {swalathForm.imageUrl && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-xs">
                  <span className="text-muted-foreground truncate max-w-xs font-mono">Image attached</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSwalathForm((prev) => ({ ...prev, imageUrl: '' }))}
                    className="h-6 text-[10px] text-destructive hover:text-destructive"
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full font-bold">
              Save Swalath (സ്വലാത്ത് അപ്‌ഡേറ്റ് ചെയ്യുക)
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Live Preview Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Live Home Page Preview (ഹോം പേജിലെ കാഴ്‌ച)</span>
        </h3>
        <SwalathCard swalath={swalathForm} />
      </div>
    </div>
  );
}
