import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Translations = {
  [key: string]: string | Translations;
};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(localStorage.getItem('magic-writer-language') || 'en');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    fetch(`/locales/${language}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok for ${language}.json`);
        }
        return response.json();
      })
      .then(data => {
        setTranslations(data);
      })
      .catch((err) => console.error(`Could not load ${language}.json`, err));
  }, [language]);

  const setLanguage = (lang: string) => {
    localStorage.setItem('magic-writer-language', lang);
    setLanguageState(lang);
  };

  const value = { language, setLanguage, translations };

  return (
    <LanguageContext.Provider value={value}>
      {Object.keys(translations).length > 0 ? children : null}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const getNestedTranslation = (obj: Translations, key: string): string | undefined => {
    const keys = key.split('.');
    let result: string | Translations | undefined = obj;
    for (const k of keys) {
        if (typeof result === 'object' && result !== null && k in result) {
            result = result[k] as string | Translations;
        } else {
            return undefined;
        }
    }
    return typeof result === 'string' ? result : undefined;
}

export const useTranslations = () => {
    const { translations } = useLanguage();
    
    return (key: string, fallback?: string): string => {
        const translation = getNestedTranslation(translations, key);
        return translation || fallback || key;
    };
};