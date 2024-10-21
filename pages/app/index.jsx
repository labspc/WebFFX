import { Spin, Upload, Input, Button, message, Space, List } from "antd";
import { useEffect, useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import { fileTypeFromBuffer } from "file-type";
import { Analytics } from "@vercel/analytics/react";
import numerify from "numerify/lib/index.cjs";
import qs from "query-string";
import JSZip from "jszip";

const { Dragger } = Upload;

const App = () => {
  const [spinning, setSpinning] = useState(false);
  const [tip, setTip] = useState(false);
  const [inputOptions, setInputOptions] = useState("-i");
  const [outputOptions, setOutputOptions] = useState("");
  const [files, setFiles] = useState("");
  const [outputFiles, setOutputFiles] = useState([]);
  const [href, setHref] = useState("");
  const [file, setFile] = useState();
  const [fileList, setFileList] = useState([]);
  const [name, setName] = useState("input.jpg");
  const [output, setOutput] = useState("today.png");
  const [downloadFileName, setDownloadFileName] = useState("today.png");
  const ffmpeg = useRef();
  const currentFSls = useRef([]);

  // 执行 FFmpeg 命令的函数
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
        // 将文件写入 FFmpeg 的虚拟文件系统
        ffmpeg.current.FS("writeFile", fileItem.name, await fetchFile(fileItem));
      }
      currentFSls.current = ffmpeg.current.FS("readdir", ".");

      // 执行 FFmpeg 命令
      setTip("开始执行命令");
      await ffmpeg.current.run(
        ...inputOptions.split(" "),
        name,
        ...outputOptions.split(" "),
        output
      );
      setSpinning(false);

      // 读取生成的输出文件
      const FSls = ffmpeg.current.FS("readdir", ".");
      const outputFiles = FSls.filter((i) => !currentFSls.current.includes(i));
      if (outputFiles.length === 1) {
        const data = ffmpeg.current.FS("readFile", outputFiles[0]);
        const type = await fileTypeFromBuffer(data.buffer);

        const objectURL = URL.createObjectURL(
          new Blob([data.buffer], { type: type.mime })
        );
        setHref(objectURL);
        setDownloadFileName(outputFiles[0]);
        message.success("运行成功，点击下载按钮下载输出文件", 10);
      } else if (outputFiles.length > 1) {
        var zip = new JSZip();
        outputFiles.forEach((filleName) => {
          const data = ffmpeg.current.FS("readFile", filleName);
          zip.file(filleName, data);
        });
        const zipFile = await zip.generateAsync({ type: "blob" });
        const objectURL = URL.createObjectURL(zipFile);
        setHref(objectURL);
        setDownloadFileName("output.zip");
        message.success("运行成功，点击下载按钮下载输出文件", 10);
      } else {
        message.success("运行成功，未生成文件，如需查看 FFmpeg 命令输出，请打开控制台", 10);
      }
    } catch (err) {
      console.error(err);
      message.error("运行失败，请检查命令是否正确或打开控制台查看错误详情", 10);
    }
  };

  // 获取文件的函数
  const handleGetFiles = async () => {
    if (!files) {
      return;
    }
    const filenames = files
      .split(",")
      .filter((i) => i)
      .map((i) => i.trim());
    const outputFilesData = [];
    for (let filename of filenames) {
      try {
        const data = ffmpeg.current.FS("readFile", filename);
        const type = await fileTypeFromBuffer(data.buffer);

        const objectURL = URL.createObjectURL(
          new Blob([data.buffer], { type: type.mime })
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

  // 加载 FFmpeg 的静态资源
  useEffect(() => {
    (async () => {
      ffmpeg.current = createFFmpeg({
        log: true,
        corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });
      ffmpeg.current.setProgress(({ ratio }) => {
        console.log(ratio);
        setTip(numerify(ratio, "0.0%"));
      });
      setTip("正在加载 FFmpeg 静态资源...");
      setSpinning(true);
      await ffmpeg.current.load();
      setSpinning(false);
    })();
  }, []);

  // 从查询字符串中获取输入和输出选项
  useEffect(() => {
    const { inputOptions, outputOptions, output } = qs.parse(
      window.location.search
    );
    if (inputOptions) {
      setInputOptions(inputOptions);
    }
    if (outputOptions) {
      setOutputOptions(outputOptions);
    }
    if (output) {
      setOutput(output);
    }
  }, []);

  // 更新查询字符串
  useEffect(() => {
    setTimeout(() => {
      let queryString = qs.stringify({ inputOptions, outputOptions, output });
      const newUrl = `${location.origin}${location.pathname}?${queryString}`;
      history.pushState("", "", newUrl);
    });
  }, [inputOptions, outputOptions, output]);

  // // 生成带时间戳的输出文件名
  // const handleTimestampOutput = () => {
  //   const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  //   setOutput(`output_${timestamp}.png`);
  // };
  // 生成带时间戳的输出文件名
  const handleTimestampOutput = () => {
    const now = new Date();
    const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const year = utc8Time.getUTCFullYear();
    const month = String(utc8Time.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utc8Time.getUTCDate()).padStart(2, '0');
    const hour = String(utc8Time.getUTCHours()).padStart(2, '0');
    setOutput(`output_${year}${month}${day}${hour}.png`);
  };

  // 2024-10-21主页面前端显示修改部分！
  return (
    <div className="page-app">
      {spinning && (
        <Spin spinning={spinning} tip={tip}>
          <div className="component-spin" />
        </Spin>
      )}

      <h2 align="center">WebFFX</h2>

      <h4>1. 选择文件</h4>
      <p style={{ color: "gray" }}>
        您的文件不会上传到服务器，只会在浏览器中处理
      </p>
      <Dragger
        multiple
        beforeUpload={(file, fileList) => {
          setFile(file);
          setFileList((v) => [...v, ...fileList]);
          setName(file.name);
          return false;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖动文件</p>
      </Dragger>
      <p style={{ color: "gray", marginTop: "10px" }}>
        支持的文件格式: JPG, PNG, GIF, MP4, AVI, MKV, MOV
      </p>
      
      <h4>2. 设置 FFmpeg 选项</h4>
      <div className="exec">
        {/* ffmpeg */}
        
        {/* <Input
          value={inputOptions}
          placeholder="请输入输入选项"
          onChange={(event) => setInputOptions(event.target.value)}
        />
        <Input
          value={name}
          placeholder="请输入输入文件名"
          onChange={(event) => setName(event.target.value)}
        /> */}
        <Input
          value={outputOptions}
          placeholder="可选：请输入输出选项"
          onChange={(event) => setOutputOptions(event.target.value)}
        />
        <Input
          value={output}
          placeholder="请输入下载文件名"
          onChange={(event) => setOutput(event.target.value)}
        />
        
        {/* <Button onClick={handleTimestampOutput}>使用时间戳命名输出文件</Button>
        <div className="command-text">
          ffmpeg {inputOptions} {name} {outputOptions} {output}
        </div> */}
        <Space direction="vertical" size="middle">
          <Button type="primary" onClick={handleTimestampOutput}>
            使用时间戳命名输出文件
          </Button>
          <div className="command-text">
            ffmpeg {inputOptions} {name} {outputOptions} {output}
          </div>
        </Space>
        
      </div>
      <h4>3. 运行并获取输出文件</h4>
      <Button type="primary" disabled={!Boolean(file)} onClick={handleExec}>
        运行
      </Button>
      <br />
      <br />
      {href && (
        <a href={href} download={downloadFileName}>
          下载文件
        </a>
      )}

      {/* 不在前端页面进行显示 */}
      {/* <h4>4. 从文件系统获取其他文件（使用逗号分隔）</h4>
      <p style={{ color: "gray" }}>
        在某些情况下，输出文件包含多个文件。此时，可以在下面的输入框中输入多个文件名，并用逗号分隔。
      </p>
      <Input
        value={files}
        placeholder="请输入下载文件名"
        onChange={(event) => setFiles(event.target.value)}
      />
      <Button type="primary" disabled={!Boolean(file)} onClick={handleGetFiles}>
        确认
      </Button> */}
      
      <br />
      <br />
      {outputFiles.map((outputFile, index) => (
        <div key={index}>
          <a href={outputFile.href} download={outputFile.name}>
            {outputFile.name}
          </a>
          <br />
        </div>
      ))}
      <br />
      <br />

      {/* <a
        href="https://github.com/xiguaxigua/ffmpeg-online"
        target="_blank"
        className="github-corner"
        aria-label="View source on GitHub"
        rel="noreferrer"
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 250 250"
          style={{
            fill: "#151513",
            color: "#fff",
            position: "absolute",
            top: 0,
            border: 0,
            right: 0,
          }}
          aria-hidden="true"
        >
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
          <path
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
            fill="currentColor"
            style={{
              transformOrigin: "130px 106px",
            }}
            className="octo-arm"
          ></path>
          <path
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
            fill="currentColor"
            className="octo-body"
          ></path>
        </svg>
      </a> */}
      <Analytics />
    </div>
  );
};

export default App;