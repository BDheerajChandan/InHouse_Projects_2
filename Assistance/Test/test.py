import torch

device = torch.device("cuda")

a = torch.randn(1000, 1000, device=device)
b = torch.randn(1000, 1000, device=device)

c = torch.matmul(a, b)

print("GPU:", torch.cuda.get_device_name(0))
print("Calculation device:", c.device)
print("Result shape:", c.shape)
print("GPU calculation successful!")