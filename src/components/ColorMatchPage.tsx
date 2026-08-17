import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowClockwise, ImageSquare, UploadSimple } from '@phosphor-icons/react';
import ScreenshotCard from '@/components/ScreenshotCard';
import { useAppStore } from '@/store/appStore';
import {
  extractImageColorProfile,
  matchScreenshots,
  type ImageColorProfile,
  type ScreenshotMatch,
} from '@/utils/imageColorMatch';

type AnalysisState = 'idle' | 'analyzing' | 'ready' | 'error';

export default function ColorMatchPage() {
  const movies = useAppStore((state) => state.movies);
  const openDetail = useAppStore((state) => state.openDetail);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<ImageColorProfile | null>(null);
  const [matches, setMatches] = useState<ScreenshotMatch[]>([]);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const analyzeFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAnalysisState('error');
      setErrorMessage('请选择 JPG、PNG、WebP 等图片文件。');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setProfile(null);
    setMatches([]);
    setErrorMessage('');
    setAnalysisState('analyzing');

    try {
      const nextProfile = await extractImageColorProfile(nextPreviewUrl);
      setProfile(nextProfile);
      setMatches(matchScreenshots(nextProfile, movies));
      setAnalysisState('ready');
    } catch (error) {
      setAnalysisState('error');
      setErrorMessage(error instanceof Error ? error.message : '图片分析失败，请换一张重试。');
    }
  };

  const openFilePicker = () => {
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.click();
  };

  return (
    <main className="tool-page color-match-page">
      <header className="tool-page__header">
        <div>
          <h1>识色</h1>
          <p>上传参考图，提取五色并匹配最接近的电影画面。</p>
        </div>
      </header>

      <section className="match-workbench" aria-live="polite">
        <div
          className={`match-dropzone${dragActive ? ' is-dragging' : ''}${previewUrl ? ' has-image' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void analyzeFile(event.dataTransfer.files[0]);
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="上传的参考图" className="match-preview" />
          ) : (
            <div className="match-dropzone__empty">
              <ImageSquare size={34} weight="thin" aria-hidden="true" />
              <strong>把参考图拖到这里</strong>
              <span>图片只在当前浏览器内分析，不会上传。</span>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => void analyzeFile(event.target.files?.[0])}
          />
          <button type="button" className="match-upload-button" onClick={openFilePicker}>
            {previewUrl ? <ArrowClockwise size={17} /> : <UploadSimple size={17} />}
            {previewUrl ? '更换图片' : '选择图片'}
          </button>
        </div>

        <div className="match-analysis">
          {analysisState === 'idle' && (
            <div className="match-analysis__placeholder">
              <span>上传后自动生成</span>
              <strong>主色、五色色板与相似电影截图</strong>
            </div>
          )}

          {analysisState === 'analyzing' && (
            <div className="match-analyzing">
              <span className="match-analyzing__line" />
              <strong>正在读取画面色彩…</strong>
              <span>本地计算通常只需要几秒。</span>
            </div>
          )}

          {analysisState === 'error' && (
            <div className="match-error" role="alert">
              <strong>没有完成识色</strong>
              <span>{errorMessage}</span>
              <button type="button" className="text-button" onClick={openFilePicker}>
                重新选择
              </button>
            </div>
          )}

          {profile && analysisState === 'ready' && (
            <motion.div
              className="match-profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="match-palette" aria-label="提取出的五色色板">
                {profile.palette.map((color, index) => (
                  <div
                    key={`${color}-${index}`}
                    className="match-palette__color"
                    style={{ backgroundColor: color }}
                    title={color.toUpperCase()}
                  >
                    <span>{color.toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <div className="match-readings">
                <div><span>色相</span><strong>{Math.round(profile.dominantHue)}°</strong></div>
                <div><span>饱和度</span><strong>{Math.round(profile.saturation * 100)}%</strong></div>
                <div><span>亮度</span><strong>{Math.round(profile.brightness * 100)}%</strong></div>
              </div>
              <p>匹配综合色相、饱和度、亮度与五色色板；结果只来自站内电影图库。</p>
            </motion.div>
          )}
        </div>
      </section>

      {analysisState === 'ready' && matches.length > 0 && (
        <section className="match-results">
          <div className="section-heading">
            <div>
              <h2>相近画面</h2>
              <p>已从 {movies.length} 部电影中找到 {matches.length} 张结果 · 分数仅表示色彩相对接近程度</p>
            </div>
          </div>
          <div className="match-results__grid">
            {matches.map((match, index) => (
              <motion.div
                key={`${match.movie.id}-${match.screenshot.id}`}
                className="match-result"
                initial={index < 8 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index, 7) * 0.025 }}
              >
                <ScreenshotCard
                  movie={match.movie}
                  screenshot={match.screenshot}
                  onClick={openDetail}
                  eager={index < 4}
                />
                <span className="match-score" title="色彩匹配分，不代表识别准确率">
                  匹配 {match.similarity}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
