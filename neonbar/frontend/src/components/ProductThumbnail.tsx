import { ShoppingCart } from 'lucide-react';

interface Props {
  foto_url?: string | null;
  imagem?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
  className?: string;
}

const sizeMap = { sm: 'size-6', md: 'size-7', lg: 'size-8', xl: 'size-28' };
const emojiMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg', xl: 'text-4xl' };
const iconMap = { sm: 12, md: 14, lg: 16, xl: 32 };

export default function ProductThumbnail({ foto_url, imagem, size = 'md', alt = '', className = '' }: Props) {
  const dim = sizeMap[size];
  return (
    <div className={`${dim} rounded-lg overflow-hidden bg-[var(--color-surface-container-high)] shrink-0 ${className}`}>
      {foto_url ? (
        <img src={foto_url} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      ) : imagem ? (
        <div className="w-full h-full flex items-center justify-center">
          <span className={emojiMap[size]}>{imagem}</span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ShoppingCart size={iconMap[size]} className="text-[var(--color-outline)]/40" />
        </div>
      )}
    </div>
  );
}
