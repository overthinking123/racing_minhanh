/**
 * City Rush 3D - Unity C# Source Code & Architecture Guide
 * Complete C# scripts and scene setup guides for Unity LTS / URP.
 */

import React, { useState } from 'react';
import { X, Copy, Check, Code2, BookOpen, Layers } from 'lucide-react';
import { soundEngine } from '../game/audio';

export const UnityExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'traffic' | 'road' | 'game' | 'guide'>('vehicle');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const scripts = {
    vehicle: `// ============================================================================
// File: Assets/Scripts/Vehicles/VehicleController.cs
// Engine: Unity LTS (Universal Render Pipeline - URP)
// ============================================================================
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class VehicleController : MonoBehaviour
{
    [Header("Car Attributes")]
    public float topSpeedKmh = 210f;
    public float accelerationRate = 18f;
    public float brakePower = 35f;
    public float handbrakePower = 60f;
    public float steeringAgility = 45f;
    public float nitroMultiplier = 1.45f;

    [Header("Wheel Transforms")]
    public Transform frontLeftWheel;
    public Transform frontRightWheel;
    public Transform rearLeftWheel;
    public Transform rearRightWheel;

    [Header("Visual Effects & Lights")]
    public MeshRenderer brakeLightsRenderer;
    [ColorUsage(true, true)] public Color brakeLightEmissiveColor = Color.red;
    public ParticleSystem nitroExhaustFlames;

    private Rigidbody rb;
    private float currentSpeedKmh;
    private float steerInput;
    private float throttleInput;
    private bool isBraking;
    private bool isNitroActive;
    private Material brakeLightsMat;

    public float CurrentSpeedKmh => currentSpeedKmh;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.mass = 1450f;
        rb.linearDamping = 0.05f;
        rb.angularDamping = 2.0f;
        rb.centerOfMass = new Vector3(0, -0.25f, 0.1f);

        if (brakeLightsRenderer != null)
        {
            brakeLightsMat = brakeLightsRenderer.material;
        }
    }

    void Update()
    {
        // 1. Player Input
        throttleInput = Input.GetAxis("Vertical"); // W / S or Up / Down
        steerInput = Input.GetAxis("Horizontal");  // A / D or Left / Right
        isBraking = Input.GetKey(KeyCode.Space) || throttleInput < 0;
        isNitroActive = Input.GetKey(KeyCode.LeftShift) && throttleInput > 0;

        // 2. Wheel Visual Feedback
        RotateAndSteerWheels();

        // 3. Brake Lights
        UpdateBrakeLights();

        // 4. Nitro FX
        if (nitroExhaustFlames != null)
        {
            if (isNitroActive && !nitroExhaustFlames.isPlaying) nitroExhaustFlames.Play();
            else if (!isNitroActive && nitroExhaustFlames.isPlaying) nitroExhaustFlames.Stop();
        }
    }

    void FixedUpdate()
    {
        currentSpeedKmh = rb.linearVelocity.magnitude * 3.6f;
        float maxSpeed = topSpeedKmh * (isNitroActive ? nitroMultiplier : 1.0f);

        // Forward Propulsion
        if (throttleInput > 0 && currentSpeedKmh < maxSpeed)
        {
            float power = accelerationRate * (isNitroActive ? 1.5f : 1.0f);
            rb.AddForce(transform.forward * power * 1000f * Time.fixedDeltaTime, ForceMode.Force);
        }

        // Braking Force
        if (isBraking && currentSpeedKmh > 2f)
        {
            float bPower = Input.GetKey(KeyCode.Space) ? handbrakePower : brakePower;
            rb.AddForce(-transform.forward * bPower * 1000f * Time.fixedDeltaTime, ForceMode.Force);
        }

        // Steering torque
        float speedRatio = Mathf.Clamp01(currentSpeedKmh / 50f);
        float turnAngle = steerInput * steeringAgility * speedRatio * Time.fixedDeltaTime;
        Quaternion turnRotation = Quaternion.Euler(0f, turnAngle, 0f);
        rb.MoveRotation(rb.rotation * turnRotation);
    }

    void RotateAndSteerWheels()
    {
        float wheelCircumference = 2f * Mathf.PI * 0.35f;
        float rotDelta = (currentSpeedKmh / 3.6f * Time.deltaTime / wheelCircumference) * 360f;

        // Steer front wheels
        float steerAngle = steerInput * 25f;
        if (frontLeftWheel) { frontLeftWheel.localEulerAngles = new Vector3(frontLeftWheel.localEulerAngles.x + rotDelta, steerAngle, 0); }
        if (frontRightWheel) { frontRightWheel.localEulerAngles = new Vector3(frontRightWheel.localEulerAngles.x + rotDelta, steerAngle, 0); }
        if (rearLeftWheel) { rearLeftWheel.localEulerAngles = new Vector3(rearLeftWheel.localEulerAngles.x + rotDelta, 0, 0); }
        if (rearRightWheel) { rearRightWheel.localEulerAngles = new Vector3(rearRightWheel.localEulerAngles.x + rotDelta, 0, 0); }
    }

    void UpdateBrakeLights()
    {
        if (brakeLightsMat == null) return;
        if (isBraking && currentSpeedKmh > 5f)
        {
            brakeLightsMat.SetColor("_EmissionColor", brakeLightEmissiveColor * 3.5f);
        }
        else
        {
            brakeLightsMat.SetColor("_EmissionColor", brakeLightEmissiveColor * 0.2f);
        }
    }
}`,

    traffic: `// ============================================================================
// File: Assets/Scripts/Traffic/TrafficManager.cs
// ============================================================================
using System.Collections.Generic;
using UnityEngine;

public class TrafficManager : MonoBehaviour
{
    public Transform playerVehicle;
    public GameObject[] trafficPrefabs; // Sedan, Taxi, Truck, Bus, SUV
    public float[] laneXPositions = new float[] { -5.4f, -1.8f, 1.8f, 5.4f };
    public int maxActiveCars = 15;
    public float spawnDistanceAhead = 160f;
    public float despawnDistanceBehind = 50f;

    private List<GameObject> activeTraffic = new List<GameObject>();
    private Queue<GameObject> trafficPool = new Queue<GameObject>();

    void Start()
    {
        // Pre-instantiate pool objects
        for (int i = 0; i < 25; i++)
        {
            GameObject prefab = trafficPrefabs[i % trafficPrefabs.Length];
            GameObject obj = Instantiate(prefab, Vector3.zero, Quaternion.identity, transform);
            obj.SetActive(false);
            trafficPool.Enqueue(obj);
        }
        InvokeRepeating(nameof(TrySpawnTraffic), 1.0f, 1.2f);
    }

    void Update()
    {
        if (playerVehicle == null) return;

        for (int i = activeTraffic.Count - 1; i >= 0; i--)
        {
            GameObject car = activeTraffic[i];
            float dz = car.transform.position.z - playerVehicle.position.z;

            // Recyle when fallen behind or too far ahead
            if (dz < -despawnDistanceBehind || dz > 280f)
            {
                car.SetActive(false);
                activeTraffic.RemoveAt(i);
                trafficPool.Enqueue(car);
            }
        }
    }

    void TrySpawnTraffic()
    {
        if (activeTraffic.Count >= maxActiveCars || trafficPool.Count == 0 || playerVehicle == null) return;

        int lane = Random.Range(0, laneXPositions.Length);
        float x = laneXPositions[lane];
        float z = playerVehicle.position.z + spawnDistanceAhead + Random.Range(0f, 40f);

        // Safe spacing check
        foreach (var active in activeTraffic)
        {
            if (Mathf.Abs(active.transform.position.x - x) < 1.0f && Mathf.Abs(active.transform.position.z - z) < 30f)
            {
                return; // Lane occupied
            }
        }

        GameObject car = trafficPool.Dequeue();
        car.transform.position = new Vector3(x, 0f, z);
        car.transform.rotation = Quaternion.identity;
        car.SetActive(true);
        activeTraffic.Add(car);
    }
}`,

    road: `// ============================================================================
// File: Assets/Scripts/Environment/RoadSegmentManager.cs
// Endless Highway Procedural Tiling System
// ============================================================================
using System.Collections.Generic;
using UnityEngine;

public class RoadSegmentManager : MonoBehaviour
{
    public Transform player;
    public GameObject roadChunkPrefab;
    public float chunkLength = 70f;
    public int totalChunks = 6;

    private List<Transform> activeChunks = new List<Transform>();

    void Start()
    {
        for (int i = 0; i < totalChunks; i++)
        {
            float z = i * chunkLength;
            GameObject chunk = Instantiate(roadChunkPrefab, new Vector3(0, 0, z), Quaternion.identity, transform);
            activeChunks.Add(chunk.transform);
        }
    }

    void Update()
    {
        if (player == null || activeChunks.Count == 0) return;

        // Find rear chunk
        Transform rearChunk = activeChunks[0];
        if (player.position.z - rearChunk.position.z > chunkLength * 1.5f)
        {
            // Find front-most chunk
            Transform frontChunk = activeChunks[activeChunks.Count - 1];
            rearChunk.position = new Vector3(0, 0, frontChunk.position.z + chunkLength);

            // Rotate list
            activeChunks.RemoveAt(0);
            activeChunks.Add(rearChunk);
        }
    }
}`,

    game: `// ============================================================================
// File: Assets/Scripts/Core/GameManager.cs
// Score, Near-Miss Detection, and Game States
// ============================================================================
using UnityEngine;
using UnityEngine.Events;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public VehicleController player;
    public float score = 0;
    public int coins = 0;
    public int nearMissCount = 0;
    public int combo = 0;
    public bool isGameOver = false;

    public UnityEvent<float, int> onScoreUpdated;
    public UnityEvent onNearMissTriggered;
    public UnityEvent onGameOverTriggered;

    void Awake()
    {
        Instance = this;
    }

    void Update()
    {
        if (isGameOver || player == null) return;

        float speed = player.CurrentSpeedKmh;
        if (speed > 40f)
        {
            score += (speed / 3.6f) * Time.deltaTime * (speed > 100f ? 1.5f : 1.0f);
            onScoreUpdated?.Invoke(score, coins);
        }
    }

    public void RegisterNearMiss(int scoreBonus, int cashBonus)
    {
        score += scoreBonus;
        coins += cashBonus;
        nearMissCount++;
        combo++;
        onNearMissTriggered?.Invoke();
    }

    public void GameOver()
    {
        if (isGameOver) return;
        isGameOver = true;
        onGameOverTriggered?.Invoke();
    }
}`,

    guide: `# HƯỚNG DẪN CÀI ĐẶT DỰ ÁN TRONG UNITY LTS (URP)

### 1. Chuẩn Bị Dự Án
- Mở Unity Hub, tạo project mới với template **3D (URP) - Universal Render Pipeline**.
- Phiên bản khuyến nghị: Unity 2022.3 LTS hoặc Unity 2023 LTS.

### 2. Cấu Trúc Thư Mục
\`\`\`
Assets/
├── Scripts/
│   ├── Core/ (GameManager.cs, SaveSystem.cs)
│   ├── Vehicles/ (VehicleController.cs, CarStats.cs)
│   ├── Traffic/ (TrafficManager.cs, TrafficCarAI.cs)
│   └── Environment/ (RoadSegmentManager.cs)
├── Prefabs/
│   ├── Cars/ (Compact, Sport, Muscle, SUV, Supercar)
│   ├── Traffic/ (Sedan, Taxi, Truck, Bus, TrafficSUV)
│   └── Road/ (RoadChunk_City, RoadChunk_Highway)
├── Materials/
└── Audio/
\`\`\`

### 3. Thiết Lập Xe & Vật Lý (VehicleController)
1. Thêm component **Rigidbody** vào xe người chơi:
   - Mass: 1450 kg
   - Collision Detection: Continuous Speculative
   - Freeze Rotation X/Z nếu muốn xe hoàn toàn không bị lật.
2. Thêm **BoxCollider** bao bọc thân xe.
3. Gán script \`VehicleController.cs\` và kéo thả 4 Transform bánh xe vào Inspector.

### 4. Thiết Lập Đoạn Đường Vô Tận (RoadSegmentManager)
1. Tạo Prefab \`RoadChunk\` với Plane mặt đường dài 70m, 4 làn xe kẻ vạch.
2. Đặt điểm trục (Pivot) ở đầu hoặc giữa chunk.
3. Gán \`RoadSegmentManager.cs\` vào một GameObject trống \`-- RoadManager --\`.
`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 font-racing">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <Code2 className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">MÃ NGUỒN UNITY C# & KIẾN TRÚC</h2>
              <p className="text-xs text-zinc-400">Export mã nguồn C# nguyên bản và sơ đồ tích hợp cho Unity LTS (URP)</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Đóng xuất mã"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-white/10 bg-zinc-900/40 overflow-x-auto px-4">
          {[
            { id: 'vehicle', label: 'VehicleController.cs' },
            { id: 'traffic', label: 'TrafficManager.cs' },
            { id: 'road', label: 'RoadSegmentManager.cs' },
            { id: 'game', label: 'GameManager.cs' },
            { id: 'guide', label: 'Hướng Dẫn Cài Đặt Unity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 font-mono text-xs text-zinc-200">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => copyToClipboard(scripts[activeTab], activeTab)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-sans font-bold text-xs rounded-xl border border-white/10 transition"
            >
              {copiedKey === activeTab ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === activeTab ? 'ĐÃ COPY VÀO BỘ NHỚ!' : 'SAO CHÉP MÃ C#'}</span>
            </button>
          </div>
          <pre className="bg-black/60 p-4 rounded-2xl border border-white/10 overflow-x-auto whitespace-pre leading-relaxed">
            {scripts[activeTab]}
          </pre>
        </div>
      </div>
    </div>
  );
};
