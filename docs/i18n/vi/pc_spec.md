# Cấu hình máy maintainer

Máy duy nhất build, scrape, và test cho repo này. Liệt kê để
reproducibility — nếu output workflow trông lạ, đây là chỗ tạo ra nó.

> Bản tiếng Anh là bản chính thức cho mọi diễn giải kỹ thuật.
> Xem: [`pc_spec.md`](../../pc_spec.md).

## Máy dev (primary)

| Thành phần | Chi tiết |
|------------|---------|
| **OS** | Windows 11 Pro 25H2 Insider Preview (Dev Channel) |
| **Build** | 26300.8376 |
| **CPU** | Intel Core i7-14700KF |
| **GPU** | NVIDIA GeForce RTX 5080 (16 GB VRAM) |
| **RAM** | 32 GB DDR5 |
| **Storage** | 1 TB SSD |

GPU thừa thãi cho repo này — webapp build CPU-bound, scraper I/O-bound.
Liệt kê cho đủ.

## Thiết bị mobile dùng để test webapp

Webapp test thật trên các thiết bị này trước mỗi release tag (DevTools
mobile emulation không thay thế được sign-off):

| Thiết bị | iOS | Trình duyệt |
|---------|-----|------------|
| iPhone 14 Pro | 26.x | Chrome, Brave |
| iPhone 13 Pro Max | 26.x | Chrome, Brave |

Nếu có bug layout xuất hiện trên các máy này, vui lòng kèm tên thiết bị
+ iOS version + browser khi báo issue.

### Android APK (Tauri)

File `.apk` cài tay (`minSdkVersion` 30 / Android 11) được test trên:

| Thiết bị | Android | Ghi chú |
|---------|---------|--------|
| Máy ảo (AVD) | 11 → mới nhất | system image arm64-v8a |
| vivo 1907 | 12 | sign-off máy thật |

`minSdkVersion` 30 nghĩa là chính hệ điều hành từ chối cài trên Android < 11, nên
sàn đã test cũng là phiên bản thấp nhất được ship. Lý do (bảo mật + phạm vi test,
không phải sàn tính năng JS) nằm trong
[`webapp/TAURI.md`](../../../webapp/TAURI.md#why-android-11-api-30).

## Xem thêm

- [`dev_env.md`](dev_env.md) — IDE, toolchain ngôn ngữ, dev workflow.
- [`webapp/TAURI.md`](../../../webapp/TAURI.md) — Tauri 2 desktop build prereqs.
