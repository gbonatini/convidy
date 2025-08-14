import React, { useState, useCallback, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';

interface ImageEditorProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  image,
  isOpen,
  onClose,
  onSave,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    
    // Calculate initial crop based on image orientation
    const imageAspect = naturalWidth / naturalHeight;
    const targetAspect = 16 / 9;
    
    let cropWidth, cropHeight, cropX, cropY;
    
    if (imageAspect > targetAspect) {
      // Image is wider than target ratio
      cropHeight = 90;
      cropWidth = (cropHeight * targetAspect * naturalHeight) / naturalWidth;
      cropX = (100 - cropWidth) / 2;
      cropY = 5;
    } else {
      // Image is taller than target ratio
      cropWidth = 90;
      cropHeight = (cropWidth * naturalWidth) / (targetAspect * naturalHeight);
      cropX = 5;
      cropY = (100 - cropHeight) / 2;
    }
    
    setCrop({
      unit: '%',
      width: cropWidth,
      height: cropHeight,
      x: cropX,
      y: cropY,
    });
  }, []);

  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.9);
    });
  }, [completedCrop]);

  const handleSave = async () => {
    console.log('🎨 Salvando imagem editada');
    const croppedImageUrl = await generateCroppedImage();
    if (croppedImageUrl) {
      console.log('🎨 Imagem processada com sucesso');
      onSave(croppedImageUrl);
    } else {
      console.error('❌ Erro ao processar imagem');
    }
    onClose();
  };

  const resetPosition = () => {
    if (imgRef.current) {
      onImageLoad({ currentTarget: imgRef.current } as React.SyntheticEvent<HTMLImageElement>);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Imagem do Evento</DialogTitle>
          <DialogDescription>
            Arraste para reposicionar a área de recorte da imagem do evento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Crop Area */}
          <div className="flex justify-center bg-muted/20 p-6 rounded-lg">
            <div className="relative max-w-full max-h-[500px] overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={16 / 9}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Imagem para recorte"
                  src={image}
                  className="max-w-full max-h-[450px] object-contain"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          </div>
          
          {/* Image info */}
          <div className="text-center text-sm text-muted-foreground">
            {imageSize.width > 0 && (
              <p>
                Dimensões originais: {imageSize.width} × {imageSize.height}px
                {imageSize.height > imageSize.width ? " (vertical)" : " (horizontal)"}
              </p>
            )}
            <p className="mt-1">Arraste a área de seleção para enquadrar sua imagem no formato 16:9</p>
          </div>

          {/* Simple Controls */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={resetPosition}
              className="flex items-center gap-2"
            >
              Resetar Posição
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Salvar Edição
          </Button>
        </DialogFooter>

        {/* Hidden canvas for generating cropped image */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </DialogContent>
    </Dialog>
  );
};