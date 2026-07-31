import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function SalathEndMessage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 font-ml">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="text-center">
          <CardContent className="p-10 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              📿 സ്വലാത്ത് സമർപ്പണം അവസാനിച്ചു
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              പങ്കെടുത്ത എല്ലാവർക്കും ഹൃദയം നിറഞ്ഞ നന്ദി!
              നിങ്ങളുടെ സജീവ പങ്കാളിത്തം ഈ സ്വലാത്ത് സമർപ്പണത്തെ വിജയകരമാക്കാൻ സഹായിച്ചു.
            </p>
            <div className="pt-4">
              <p className="text-primary font-semibold text-xl font-arabic" dir="rtl">
                🌸 جزاكم اللهُ خيرًا 🌸
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
