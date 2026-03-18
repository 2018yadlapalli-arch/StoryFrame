Test text-to-image — curl:
  curl -X POST http://localhost:8081/v1/images/generations \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "a mountain lake at sunset, photorealistic",
      "size": "512x512",
      "num_inference_steps": 4,
      "response_format": "url"
    }' --max-time 120

  Get image as base64 (for apps that prefer it):
  curl -X POST http://localhost:8081/v1/images/generations \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "a mountain lake at sunset",
      "size": "512x512",
      "num_inference_steps": 4,
      "response_format": "b64_json"
    }' --max-time 120

  A1111-compatible format (for apps like Open WebUI, InvokeAI):
  curl -X POST http://localhost:8081/sdapi/v1/txt2img \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "a mountain lake at sunset",
      "width": 512,
      "height": 512,
      "steps": 4
    }' --max-time 120

  Key parameters:

  ┌─────────────────────┬───────────┬────────────────────────────────────────────────┐
  │      Parameter      │  Default  │                     Notes                      │
  ├─────────────────────┼───────────┼────────────────────────────────────────────────┤
  │ num_inference_steps │ 4         │ 1–8 works well for this distilled model        │
  ├─────────────────────┼───────────┼────────────────────────────────────────────────┤
  │ size                │ 1024x1024 │ Use 512x512 for faster generation              │
  ├─────────────────────┼───────────┼────────────────────────────────────────────────┤
  │ response_format     │ b64_json  │ "url" saves to file, "b64_json" returns inline │
  └─────────────────────┴───────────┴────────────────────────────────────────────────┘
