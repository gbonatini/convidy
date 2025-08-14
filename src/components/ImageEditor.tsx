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
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 60,
    x: 10,
    y: 20,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set default crop to center the image
    setCrop({
      unit: '%',
      width: 80,
      height: 60,
      x: 10,
      y: 20,
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

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetPosition = () => {
    setCrop({
      unit: '%',
      width: 80,
      height: 60,
      x: 10,
      y: 20,
    });
    setScale(1);
    setRotation(0);
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
          <div className="flex justify-center bg-muted/20 p-4 rounded-lg">
            <div className="relative">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={16 / 9}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={image}
                  style={{
                    maxWidth: '600px',
                    maxHeight: '400px',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
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