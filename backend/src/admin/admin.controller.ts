import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên món không được để trống' })
  name: string;

  @IsNumber()
  @Min(0, { message: 'Giá món phải lớn hơn hoặc bằng 0' })
  price: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0, { message: 'Giá món phải lớn hơn hoặc bằng 0' })
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
  code: string;

  @IsInt()
  @Min(1, { message: 'Phần trăm giảm giá phải từ 1%' })
  @Max(100, { message: 'Phần trăm giảm giá tối đa 100%' })
  percent: number;

  @IsInt()
  @Min(0, { message: 'Giá trị đơn tối thiểu không được âm' })
  @IsOptional()
  minOrderValue?: number;

  @IsInt()
  @Min(1, { message: 'Giới hạn lượt dùng phải từ 1 trở lên' })
  @IsOptional()
  usageLimit?: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không đúng định dạng ISO' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'Ngày kết thúc không đúng định dạng ISO' })
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdatePromotionDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  percent?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

// Cấu hình thư mục lưu ảnh upload
const UPLOAD_DIR = join(process.cwd(), '..', 'frontend', 'public', 'menu');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =================== 1. QUẢN LÝ MÓN ===================

  @Get('products')
  getProducts() {
    return this.adminService.getProducts();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Put('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteProduct(id);
  }

  @Post('products/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `item-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    return {
      imageUrl: `${webUrl}/menu/${file.filename}`,
      filename: file.filename,
    };
  }

  // =================== 2. QUẢN LÝ KHUYẾN MÃI ===================

  @Get('promotions')
  getPromotions() {
    return this.adminService.getPromotions();
  }

  @Post('promotions')
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.adminService.createPromotion(dto);
  }

  @Put('promotions/:code')
  updatePromotion(
    @Param('code') code: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.adminService.updatePromotion(code, dto);
  }

  @Delete('promotions/:code')
  deletePromotion(@Param('code') code: string) {
    return this.adminService.deletePromotion(code);
  }

  // =================== 3. BÁO CÁO DOANH THU ===================

  @Get('reports/revenue')
  getRevenueReport(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate || date;
    const end = endDate || start;
    return this.adminService.getRevenueReport(start, end);
  }
}

