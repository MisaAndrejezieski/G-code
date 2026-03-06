/**
 * Image Processor Module
 * Handles image loading, analysis and point generation
 */

export class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    element: img,
                    width: img.width,
                    height: img.height,
                    size: file.size
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async processImage(image, config) {
        // Redimensionar canvas para o tamanho da imagem
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        
        // Desenhar imagem no canvas
        this.ctx.drawImage(image.element, 0, 0);
        
        // Obter dados da imagem
        const imageData = this.ctx.getImageData(0, 0, image.width, image.height);
        const points = this.extractCuttingPoints(imageData, config);
        
        // Otimizar caminho se necessário
        if (config.optimizePath) {
            return this.optimizePath(points);
        }
        
        return points;
    }

    extractCuttingPoints(imageData, config) {
        const points = [];
        const { width, height } = imageData;
        const step = Math.max(1, Math.floor(config.resolution));
        
        // Escala para conversão de pixels para mm
        const scaleX = config.widthScale / width;
        const scaleY = config.heightScale / height;
        
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const index = (y * width + x) * 4;
                
                // Calcular brilho do pixel
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const brightness = (r + g + b) / 3;
                
                // Aplicar inversão se necessário
                const value = config.invertColors ? 255 - brightness : brightness;
                
                // Verificar se deve cortar
                if (value < config.threshold) {
                    points.push({
                        x: x * scaleX,
                        y: (height - y) * scaleY, // Inverter Y para coordenadas CNC
                        z: config.cutDepth,
                        cut: true
                    });
                }
            }
        }
        
        return points;
    }

    optimizePath(points) {
        // Implementar otimização de caminho usando Nearest Neighbor
        if (points.length === 0) return points;
        
        const optimized = [points[0]];
        const remaining = points.slice(1);
        
        while (remaining.length > 0) {
            const last = optimized[optimized.length - 1];
            
            // Encontrar ponto mais próximo
            let nearestIndex = 0;
            let nearestDistance = this.distance(last, remaining[0]);
            
            for (let i = 1; i < remaining.length; i++) {
                const dist = this.distance(last, remaining[i]);
                if (dist < nearestDistance) {
                    nearestDistance = dist;
                    nearestIndex = i;
                }
            }
            
            optimized.push(remaining[nearestIndex]);
            remaining.splice(nearestIndex, 1);
        }
        
        return optimized;
    }

    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}