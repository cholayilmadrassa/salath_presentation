import { motion } from "framer-motion";

export default function SalathEndMessage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-white to-green-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-2xl"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-green-700">
          📿 സലാത്ത് സമർപ്പണം അവസാനിച്ചു
        </h1>
        <p className="text-lg md:text-xl text-gray-700 leading-relaxed mt-4">
          പങ്കെടുത്ത എല്ലാവർക്കും ഹൃദയം നിറഞ്ഞ നന്ദി!
          നിങ്ങളുടെ സജീവ പങ്കാളിത്തം ഈ സലാത്ത് സമർപ്പണത്തെ വിജയകരമാക്കാൻ സഹായിച്ചു.
        </p>
        <div className="mt-8">
          <p className="text-green-600 font-semibold text-xl">
            🌸 جزاكم اللهُ خيرًا 🌸
          </p>
        </div>
      </motion.div>
    </div>
  );
}
