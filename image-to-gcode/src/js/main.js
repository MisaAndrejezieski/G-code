/**
 * Image to G-Code Professional Converter
 * Main entry point - ES6 Module
 */

import { GCodeGenerator } from './gcode-generator.js';
import { ImageProcessor } from './image-processor.js';
import { Simulator } from './simulator.js';

class ImageToGCodeApp {
    constructor() {
        this.imageProcessor = new ImageProcessor();
        this.gcodeGenerator = new GCodeGenerator();
        this.simulator = new Simulator('simulatorCanvas');
        
        this.currentImage = null;
        this.currentGCode = '';
        this.config = this.getDefaultConfig();
        
        this.initializeEventListeners();
        this.initializeTheme();
        this.initializeUI();
    }

    getDefaultConfig() {
        return {
            cutDepth: -1.0,
            feedRate: 1000,
            plungeRate: 500,
            safeHeight: 5.0,
            retractHeight: 2.0,
            resolution: 0.5,
            threshold: 128,
            invertColors: false,
            optimizePath: true,
            widthScale: 100,
            heightScale: 100,
            maintainAspect: true
        };
    }

    initializeEventListeners() {
        // Upload de imagem
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Configurações
        document.getElementById('resetConfig').addEventListener('click', this.resetConfig.bind(this));
        document.getElementById('generateBtn').addEventListener('click', this.generateGCode.bind(this));
        
        // Input listeners para atualizações em tempo real
        this.attachConfigListeners();
        
        // Ações do G-Code
        document.getElementById('copyGCode').addEventListener('click', this.copyGCode.bind(this));
        document.getElementById('downloadGCode').addEventListener('click', this.downloadGCode.bind(this));
        document.getElementById('formatGCode').addEventListener('click', this.formatGCode.bind(this));
        
        // Simulador
        document.getElementById('simulateBtn').addEventListener('click', this.simulate.bind(this));
        document.getElementById('clearSimulation').addEventListener('click', this.clearSimulation.bind(this));
        
        // Controles de visualização
        document.getElementById('zoomIn').addEventListener('click', () => this.simulator.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.simulator.zoom(0.8));
        document.getElementById('fitView').addEventListener('click', () => this.simulator.fitToView());
        
        // Tema
        document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));
        
        // Remover imagem
        document.getElementById('removeImage').addEventListener('click', this.removeImage.bind(this));
    }

    attachConfigListeners() {
        const configInputs = [
            'cutDepth', 'feedRate', 'plungeRate', 'safeHeight',
            'retractHeight', 'resolution', 'threshold', 'thresholdValue',
            'invertColors', 'optimizePath', 'widthScale', 'heightScale',
            'maintainAspect'
        ];

        configInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.updateConfig(id, e.target.value);
                    if (id === 'threshold' && id === 'thresholdValue') {
                        document.getElementById('thresholdValue').value = e.target.value;
                        document.getElementById('threshold').value = e.target.value;
                    }
                });
            }
        });
    }

    updateConfig(key, value) {
        if (key === 'invertColors' || key === 'optimizePath' || key === 'maintainAspect') {
            this.config[key] = value === 'on' ? true : value;
        } else {
            this.config[key] = parseFloat(value);
        }

        // Atualizar preview se necessário
        if (this.currentImage && (key === 'threshold' || key === 'invertColors')) {
            this.updatePreview();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('dropZone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('dropZone').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('dropZone').classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImage(file);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImage(file);
        }
    }

    async processImage(file) {
        try {
            this.updateStatus('Processando imagem...', 'info');
            
            // Validar tamanho
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Imagem muito grande. Máximo 10MB.');
            }

            // Carregar imagem
            this.currentImage = await this.imageProcessor.loadImage(file);
            
            // Atualizar UI
            this.updateImagePreview(file);
            this.updateImageInfo(this.currentImage);
            
            // Habilitar botão de geração
            document.getElementById('generateBtn').disabled = false;
            
            this.updateStatus('Imagem carregada com sucesso!', 'success');
            
        } catch (error) {
            this.updateStatus(`Erro: ${error.message}`, 'error');
            console.error(error);
        }
    }

    updateImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            document.getElementById('previewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    updateImageInfo(image) {
        document.getElementById('imageDimensions').textContent = 
            `${image.width}x${image.height}`;
        document.getElementById('imageSize').textContent = 
            (image.size / 1024).toFixed(2);
    }

    async generateGCode() {
        try {
            this.updateStatus('Gerando G-Code...', 'info');
            
            const startTime = performance.now();
            
            // Processar imagem para pontos de corte
            const points = await this.imageProcessor.processImage(
                this.currentImage,
                this.config
            );
            
            // Gerar G-Code
            this.currentGCode = this.gcodeGenerator.generate(points, this.config);
            
            // Atualizar editor
            document.getElementById('gcodeEditor').textContent = this.currentGCode;
            
            // Atualizar estatísticas
            const lines = this.currentGCode.split('
').length;
            document.getElementById('gcodeStats').textContent = `${lines} linhas`;
            
            // Habilitar botões
            document.getElementById('simulateBtn').disabled = false;
            document.getElementById('copyGCode').disabled = false;
            document.getElementById('downloadGCode').disabled = false;
            
            const endTime = performance.now();
            document.getElementById('processingTime').textContent = 
                `${(endTime - startTime).toFixed(0)} ms`;
            
            this.updateStatus('G-Code gerado com sucesso!', 'success');
            
        } catch (error) {
            this.updateStatus(`Erro ao gerar G-Code: ${error.message}`, 'error');
            console.error(error);
        }
    }

    simulate() {
        try {
            this.simulator.loadGCode(this.currentGCode);
            this.simulator.animate();
            this.updateStatus('Simulação em andamento...', 'info');
        } catch (error) {
            this.updateStatus(`Erro na simulação: ${error.message}`, 'error');
        }
    }

    clearSimulation() {
        this.simulator.clear();
        this.updateStatus('Simulação limpa', 'info');
    }

    async copyGCode() {
        try {
            await navigator.clipboard.writeText(this.currentGCode);
            this.updateStatus('G-Code copiado!', 'success');
        } catch (error) {
            this.updateStatus('Erro ao copiar', 'error');
        }
    }

    downloadGCode() {
        const format = document.getElementById('gcodeFormat').value;
        const blob = new Blob([this.currentGCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `output.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.updateStatus('Download iniciado', 'success');
    }

    formatGCode() {
        // Implementar formatação do G-Code
        this.updateStatus('G-Code formatado', 'info');
    }

    resetConfig() {
        this.config = this.getDefaultConfig();
        
        // Atualizar inputs
        Object.keys(this.config).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.config[key];
                } else {
                    element.value = this.config[key];
                }
            }
        });
        
        this.updateStatus('Configurações restauradas', 'info');
    }

    removeImage() {
        this.currentImage = null;
        this.currentGCode = '';
        
        document.getElementById('previewContainer').style.display = 'none';
        document.getElementById('imagePreview').src = '#';
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('simulateBtn').disabled = true;
        document.getElementById('gcodeEditor').textContent = '';
        
        this.updateStatus('Imagem removida', 'info');
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    initializeUI() {
        this.updateStatus('Pronto para começar!', 'info');
        
        // Inicializar memória
        if (performance.memory) {
            setInterval(() => {
                const memory = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
                document.getElementById('memoryUsage').textContent = `${memory} MB`;
            }, 2000);
        }
    }

    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        
        // Opcional: adicionar ícone baseado no tipo
        const icon = statusEl.previousElementSibling;
        if (icon) {
            icon.className = `fas fa-${this.getStatusIcon(type)}`;
        }
    }

    getStatusIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    updatePreview() {
        // Implementar preview em tempo real
        if (this.currentImage) {
            // Usar o canvas para mostrar preview do processamento
        }
    }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ImageToGCodeApp();
});