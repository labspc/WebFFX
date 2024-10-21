import { Spin, Upload, Input, Button, message, Space, List } from "antd";
import { useEffect, useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import { fileTypeFromBuffer } from "file-type";
import { Analytics } from "@vercel/analytics/react";
import numerify from "numerify";
import qs from "query-string";
import JSZip from "jszip";

import Head from 'next/head'; // 添加这一行

const { Dragger } = Upload;

interface OutputFile {
  name: string;
  href: string;
}

const App = () => {
  const [spinning, setSpinning] = useState(false);
  const [tip, setTip] = useState<string>("");
  const [inputOptions, setInputOptions] = useState("-i");
  const [outputOptions, setOutputOptions] = useState("");
  const [files, setFiles] = useState("");
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [href, setHref] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [fileList, setFileList] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [output, setOutput] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");
  const ffmpeg = useRef<any>();
  const currentFSls = useRef<string[]>([]);

  const handleExec = async () => {
    if (!file) {
      return;
    }
    setOutputFiles([]);
    setHref("");
    setDownloadFileName("");
    try {
      setTip("正在加载文件到浏览器");
      setSpinning(true);
      for (const fileItem of fileList) {
        ffmpeg.current.FS("writeFile", fileItem.name, await fetchFile(fileItem));
      }
      currentFSls.current = ffmpeg.current.FS("readdir", ".");

      setTip("开始执行命令");
      await ffmpeg.current.run(
        ...inputOptions.split(" "),
        name,
        ...outputOptions.split(" "),
        output
      );
      setSpinning(false);

      const FSls = ffmpeg.current.FS("readdir", ".");
      const outputFiles = FSls.filter((i: string) => !currentFSls.current.includes(i));
      if (outputFiles.length === 1) {
        const data = ffmpeg.current.FS("readFile", outputFiles[0]);
        const type = await fileTypeFromBuffer(data.buffer);

        const objectURL = URL.createObjectURL(
          new Blob([data.buffer], { type: type ? type.mime : "application/octet-stream" })
        );
        setHref(objectURL);
        setDownloadFileName(outputFiles[0]);
        message.success("运行成功，点击下载链接下载输出文件", 10);
      } else if (outputFiles.length > 1) {
        var zip = new JSZip();
        outputFiles.forEach((filleName: string) => {
          const data = ffmpeg.current.FS("readFile", filleName);
          zip.file(filleName, data);
        });
        const zipFile = await zip.generateAsync({ type: "blob" });
        const objectURL = URL.createObjectURL(zipFile);
        setHref(objectURL);
        setDownloadFileName("output.zip");
        message.success("运行成功，点击下载链接下载输出文件", 10);
      } else {
        message.success("运行成功，未生成文件，如需查看 FFmpeg 命令输出，请打开控制台", 10);
      }
    } catch (err) {
      console.error(err);
      message.error("运行失败，请检查命令是否正确或打开控制台查看错误详情", 10);
    }
  };

  const handleGetFiles = async () => {
    if (!files) {
      return;
    }
    const filenames = files
      .split(",")
      .filter((i) => i)
      .map((i) => i.trim());
    const outputFilesData: OutputFile[] = [];
    for (let filename of filenames) {
      try {
        const data = ffmpeg.current.FS("readFile", filename);
        const type = await fileTypeFromBuffer(data.buffer);

        const objectURL = URL.createObjectURL(
          new Blob([data.buffer], { type: type ? type.mime : "application/octet-stream" })
        );
        outputFilesData.push({
          name: filename,
          href: objectURL,
        });
      } catch (err) {
        message.error(`${filename} 获取失败`);
        console.error(err);
      }
    }
    setOutputFiles(outputFilesData);
  };

  useEffect(() => {
    (async () => {
      ffmpeg.current = createFFmpeg({
        log: true,
        corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });
      ffmpeg.current.setProgress(({ ratio }: { ratio: number }) => {
        console.log(ratio);
        setTip(numerify(ratio, "0.0%"));
      });
      setTip("正在加载 FFmpeg 静态资源...");
      setSpinning(true);
      await ffmpeg.current.load();
      setSpinning(false);
    })();
  }, []);

  useEffect(() => {
    const { inputOptions, outputOptions, output } = qs.parse(
      window.location.search
    );
    if (inputOptions) {
      setInputOptions(Array.isArray(inputOptions) ? inputOptions.join(" ") : inputOptions);
    }
    if (outputOptions) {
      setOutputOptions(Array.isArray(outputOptions) ? outputOptions.join(" ") : outputOptions);
    }
    if (output) {
      setOutput(Array.isArray(output) ? output.join(" ") : output);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      let queryString = qs.stringify({ inputOptions, outputOptions, output });
      const newUrl = `${location.origin}${location.pathname}?${queryString}`;
      history.pushState("", "", newUrl);
    });
  }, [inputOptions, outputOptions, output]);

  const handleTimestampOutput = () => {
    const now = new Date();
    const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const year = utc8Time.getUTCFullYear();
    const month = String(utc8Time.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utc8Time.getUTCDate()).padStart(2, '0');
    const hour = String(utc8Time.getUTCHours()).padStart(2, '0');
    const minute = String(utc8Time.getUTCMinutes()).padStart(2, '0');
    setOutput(`output_${year}${month}${day}T${hour}${minute}.png`);
  };

  const beforeUpload = (file: File, fileList: File[]) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isValidSize = (isImage && file.size <= 20 * 1024 * 1024) || (isVideo && file.size <= 200 * 1024 * 1024);

    if (!isValidSize) {
      message.error(`文件 ${file.name} 超过大小限制。图片文件应小于20MB，视频文件应小于200MB。`);
      return Upload.LIST_IGNORE;
    }

    setFile(file);
    setFileList((v) => [...v, ...fileList]);
    setName(file.name);
    return false;
  };

  return (
    <div className="page-app">
      {spinning && (
        <Spin spinning={spinning} tip={tip}>
          <div className="component-spin" />
        </Spin>
      )}

      <h1 style={{ textAlign: "center", fontSize: "2em", fontWeight: "bold", margin: "10px 0" }}>WebFFX</h1>
      <p style={{ textAlign: "center", fontSize: "1em", color: "gray", margin: "5px 0" }}>Local-fisrt Converter</p>

      <h4>1. 选择文件</h4>
      <p style={{ color: "gray" }}>
        您的文件不会上传到服务器，只会在浏览器中处理
      </p>
      <Dragger
        multiple
        beforeUpload={beforeUpload}
        style={{ padding: "22px", maxWidth: "420px", margin: "0 auto", border: "2px dashed #1890ff", borderRadius: "8px", backgroundColor: "#f0f2f5" }}
      >
        <p className="ant-upload-drag-icon" style={{ color: "#1890ff" }}>
          <InboxOutlined />
        </p>
        <p className="ant-upload-text" style={{ color: "#1890ff" }}>点击或拖动文件到此区域</p>
      </Dragger>
      <style jsx>{`
        @media (max-width: 600px) {
          .ant-upload-drag-icon {
        font-size: 24px;
          }
          .ant-upload-text {
        font-size: 14px;
          }
        }
      `}</style>
      <p style={{ color: "gray", marginTop: "10px" }}>
        支持的文件格式: JPG, PNG, GIF, MP4, AVI, MKV, MOV
      </p>
      <p style={{ color: "red", marginTop: "10px" }}>
        文件大小限制: 图片文件应小于20MB，视频文件应小于200MB
      </p>

      <h4>2. 设置 FFmpeg 选项</h4>
      <div className="exec">
        <Input
          value={outputOptions}
          placeholder="可选：请输入输出选项(通常不填写)"
          onChange={(event) => setOutputOptions(event.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <Input
          value={output}
          placeholder="请输入下载文件名"
          onChange={(event) => setOutput(event.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <Space direction="vertical" size="middle">
          <p style={{ color: "red", marginTop: "8px" }}>
            提示：文件后缀名可自定义
          </p>
          <Button type="primary" onClick={handleTimestampOutput}>
            使用时间戳命名输出文件
          </Button>
          {/* <div className="command-text" style={{ wordBreak: "break-all" }}>
            ffmpeg {inputOptions} {name} {outputOptions} {output}
          </div> */}
        </Space>
      </div>
      <h4>3. 运行并获取输出文件</h4>
      <Button type="primary" disabled={!Boolean(file)} onClick={handleExec} style={{ marginBottom: "10px" }}>
        运行
      </Button>
      <br />
      {href && (
        <a href={href} download={downloadFileName}>
          下载文件
        </a>
      )}
      <br />
      {outputFiles.map((outputFile, index) => (
        <div key={index}>
          <a href={outputFile.href} download={outputFile.name}>
            {outputFile.name}
          </a>
          <br />
        </div>
      ))}




      <Analytics />
      <footer style={{ textAlign: "center", padding: "20px 0", marginTop: "40px", backgroundColor: "#f0f2f5" }}>
        <div style={{ fontSize: "16px", color: "#555" }}>
          © 2024 WebFFX. Made with <span style={{ color: "#ff4d4f" }}>❤️</span> by Lambert
        </div>
        <div style={{ textAlign: "center", marginTop: "10px", fontSize: "14px", color: "#777" }}>
          <pre style={{ backgroundColor: "#f0f2f5", border: "none", padding: "0" }}>
            <code>
              基于 <a href="https://ffmpegwasm.netlify.app/" style={{ color: "#1890ff" }}>ffmpeg.wasm</a>、<a href="https://www.typescriptlang.org/" style={{ color: "#1890ff" }}>TypeScript</a>、<a href="https://nextjs.org/" style={{ color: "#1890ff" }}>Next.js</a> 构建
            </code>
          </pre>
        </div>
      </footer>
    </div>
  );
};

export default App;
